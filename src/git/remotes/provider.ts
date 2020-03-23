'use strict';
import { env, Range, Uri, window } from 'vscode';
import { AutolinkReference } from '../../config';
import { Logger } from '../../logger';
import { Messages } from '../../messages';
import { GitLogCommit } from '../models/logCommit';
import { DynamicAutolinkReference } from '../../annotations/autolinks';
import { PullRequest } from '../models/pullRequest';
import { CredentialManager } from '../../credentials';
import { debug, Promises } from '../../system';
import { Container } from '../../container';

export enum RemoteResourceType {
	Branch = 'branch',
	Branches = 'branches',
	Commit = 'commit',
	File = 'file',
	Repo = 'repo',
	Revision = 'revision'
}

export type RemoteResource =
	| {
			type: RemoteResourceType.Branch;
			branch: string;
	  }
	| {
			type: RemoteResourceType.Branches;
	  }
	| {
			type: RemoteResourceType.Commit;
			sha: string;
	  }
	| {
			type: RemoteResourceType.File;
			branch?: string;
			fileName: string;
			range?: Range;
	  }
	| {
			type: RemoteResourceType.Repo;
	  }
	| {
			type: RemoteResourceType.Revision;
			branch?: string;
			commit?: GitLogCommit;
			fileName: string;
			range?: Range;
			sha?: string;
	  };

export function getNameFromRemoteResource(resource: RemoteResource) {
	switch (resource.type) {
		case RemoteResourceType.Branch:
			return 'Branch';
		case RemoteResourceType.Branches:
			return 'Branches';
		case RemoteResourceType.Commit:
			return 'Commit';
		case RemoteResourceType.File:
			return 'File';
		case RemoteResourceType.Repo:
			return 'Repository';
		case RemoteResourceType.Revision:
			return 'Revision';
		default:
			return '';
	}
}

export abstract class RemoteProvider {
	protected _name: string | undefined;

	constructor(
		public readonly domain: string,
		public readonly path: string,
		public readonly protocol: string = 'https',
		name?: string,
		public readonly custom: boolean = false
	) {
		this._name = name;
	}

	get autolinks(): (AutolinkReference | DynamicAutolinkReference)[] {
		return [];
	}

	get displayPath(): string {
		return this.path;
	}

	get icon(): string {
		return 'remote';
	}

	abstract get name(): string;

	async copy(resource: RemoteResource): Promise<{} | undefined> {
		const url = this.url(resource);
		if (url === undefined) return undefined;

		try {
			void (await env.clipboard.writeText(url));

			return undefined;
		} catch (ex) {
			if (ex.message.includes("Couldn't find the required `xsel` binary")) {
				window.showErrorMessage(
					'Unable to copy remote url, xsel is not installed. Please install it via your package manager, e.g. `sudo apt install xsel`'
				);
				return undefined;
			}

			Logger.error(ex, 'CopyRemoteUrlToClipboardCommand');
			return Messages.showGenericErrorMessage('Unable to copy remote url');
		}
	}

	hasApi(): this is RemoteProviderWithApi {
		return RemoteProviderWithApi.is(this);
	}

	open(resource: RemoteResource): Thenable<{} | undefined> {
		return this.openUrl(this.url(resource));
	}

	url(resource: RemoteResource): string | undefined {
		switch (resource.type) {
			case RemoteResourceType.Branch:
				return this.getUrlForBranch(encodeURIComponent(resource.branch));
			case RemoteResourceType.Branches:
				return this.getUrlForBranches();
			case RemoteResourceType.Commit:
				return this.getUrlForCommit(encodeURIComponent(resource.sha));
			case RemoteResourceType.File:
				return this.getUrlForFile(
					resource.fileName,
					resource.branch !== undefined ? encodeURIComponent(resource.branch) : undefined,
					undefined,
					resource.range
				);
			case RemoteResourceType.Repo:
				return this.getUrlForRepository();
			case RemoteResourceType.Revision:
				return this.getUrlForFile(
					resource.fileName,
					resource.branch !== undefined ? encodeURIComponent(resource.branch) : undefined,
					resource.sha !== undefined ? encodeURIComponent(resource.sha) : undefined,
					resource.range
				);
			default:
				return undefined;
		}
	}

	protected get baseUrl() {
		return `${this.protocol}://${this.domain}/${this.path}`;
	}

	protected formatName(name: string) {
		if (this._name !== undefined) return this._name;
		return `${name}${this.custom ? ` (${this.domain})` : ''}`;
	}

	protected splitPath(): [string, string] {
		const index = this.path.indexOf('/');
		return [this.path.substring(0, index), this.path.substring(index + 1)];
	}

	protected abstract getUrlForBranch(branch: string): string;

	protected abstract getUrlForBranches(): string;

	protected abstract getUrlForCommit(sha: string): string;

	protected abstract getUrlForFile(fileName: string, branch?: string, sha?: string, range?: Range): string;

	protected getUrlForRepository(): string {
		return this.baseUrl;
	}

	private openUrl(url?: string): Thenable<{} | undefined> {
		if (url === undefined) return Promise.resolve(undefined);

		return env.openExternal(Uri.parse(url));
	}
}

export abstract class RemoteProviderWithApi<T extends string | {} = any> extends RemoteProvider {
	static is(provider: RemoteProvider | undefined): provider is RemoteProviderWithApi {
		return provider instanceof RemoteProviderWithApi;
	}

	constructor(domain: string, path: string, protocol?: string, name?: string, custom?: boolean) {
		super(domain, path, protocol, name, custom);

		Container.context.subscriptions.push(CredentialManager.onDidClear(this.onCredentialsCleared, this));
	}

	private onCredentialsCleared(key: string | undefined) {
		if (key === undefined || key === this.name) {
			this._credentials = undefined;
			this._prsByCommit.clear();
		}
	}

	abstract get apiBaseUrl(): string;

	protected _credentials: T | null | undefined;
	protected credentials() {
		if (this._credentials === undefined) {
			return CredentialManager.getAs<T>(this.name).then(c => {
				this._credentials = c ?? null;
				return c ?? undefined;
			});
		}
		return this._credentials ?? undefined;
	}

	abstract async connect(): Promise<void>;

	disconnect(): Promise<void> {
		this._prsByCommit.clear();
		return this.clearCredentials();
	}

	async isConnected(): Promise<boolean> {
		return (await this.credentials()) != null;
	}

	private _prsByCommit = new Map<string, Promise<PullRequest | null> | PullRequest | null>();

	getPullRequestForCommit(ref: string): Promise<PullRequest | undefined> | PullRequest | undefined {
		let pr = this._prsByCommit.get(ref);
		if (pr === undefined) {
			pr = this.getPullRequestForCommitCore(ref);
			this._prsByCommit.set(ref, pr);
		}
		if (pr == null || !Promises.is(pr)) return pr ?? undefined;

		return pr.then(pr => pr ?? undefined);
	}

	@debug()
	private async getPullRequestForCommitCore(ref: string) {
		const cc = Logger.getCorrelationContext();

		if (!(await this.isConnected())) return null;

		try {
			const pr = (await this.onGetPullRequestForCommit(this._credentials!, ref)) ?? null;
			this._prsByCommit.set(ref, pr);
			return pr;
		} catch (ex) {
			Logger.error(ex, cc);

			this._prsByCommit.delete(ref);
			return null;
		}
	}

	protected abstract onGetPullRequestForCommit(credentials: T, ref: string): Promise<PullRequest | undefined>;

	protected async clearCredentials() {
		this._credentials = undefined;
		await CredentialManager.clear(this.name);
		this._credentials = undefined;
	}

	protected saveCredentials(credentials: T) {
		this._credentials = credentials;
		return CredentialManager.addOrUpdate(this.name, credentials);
	}
}
