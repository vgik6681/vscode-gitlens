'use strict';
import { Range, window } from 'vscode';
import { RemoteProviderWithApi } from './provider';
import { AutolinkReference } from '../../config';
import { DynamicAutolinkReference } from '../../annotations/autolinks';
import { Container } from '../../container';
import { PullRequest } from '../models/pullRequest';

const issueEnricher3rdParyRegex = /\b(\w+\\?-?\w+(?!\\?-)\/\w+\\?-?\w+(?!\\?-))\\?#([0-9]+)\b/g;

export class GitHubRemote extends RemoteProviderWithApi<{ token: string }> {
	constructor(domain: string, path: string, protocol?: string, name?: string, custom: boolean = false) {
		super(domain, path, protocol, name, custom);
	}

	get apiBaseUrl() {
		return this.custom ? `${this.protocol}://${this.domain}/api` : `https://api.${this.domain}`;
	}

	private _autolinks: (AutolinkReference | DynamicAutolinkReference)[] | undefined;
	get autolinks(): (AutolinkReference | DynamicAutolinkReference)[] {
		if (this._autolinks === undefined) {
			this._autolinks = [
				{
					prefix: '#',
					url: `${this.baseUrl}/issues/<num>`,
					title: 'Open Issue #<num>'
				},
				{
					prefix: 'gh-',
					url: `${this.baseUrl}/issues/<num>`,
					title: 'Open Issue #<num>',
					ignoreCase: true
				},
				{
					linkify: (text: string) =>
						text.replace(
							issueEnricher3rdParyRegex,
							`[$&](${this.protocol}://${this.domain}/$1/issues/$2 "Open Issue #$2 from $1")`
						)
				}
			];
		}
		return this._autolinks;
	}

	get icon() {
		return 'github';
	}

	get name() {
		return this.formatName('GitHub');
	}

	async connect() {
		const token = await window.showInputBox({
			placeHolder: 'Generate a personal access token from github.com (required)',
			prompt: 'Enter a GitHub personal access token',
			validateInput: (value: string) => (value ? undefined : 'Must be a valid GitHub personal access token'),
			ignoreFocusOut: true
		});
		if (!token) {
			this.clearCredentials();
			return;
		}

		this.saveCredentials({ token: token });
	}

	protected getUrlForBranches(): string {
		return `${this.baseUrl}/branches`;
	}

	protected getUrlForBranch(branch: string): string {
		return `${this.baseUrl}/commits/${branch}`;
	}

	protected getUrlForCommit(sha: string): string {
		return `${this.baseUrl}/commit/${sha}`;
	}

	protected getUrlForFile(fileName: string, branch?: string, sha?: string, range?: Range): string {
		let line;
		if (range) {
			if (range.start.line === range.end.line) {
				line = `#L${range.start.line}`;
			} else {
				line = `#L${range.start.line}-L${range.end.line}`;
			}
		} else {
			line = '';
		}

		if (sha) return `${this.baseUrl}/blob/${sha}/${fileName}${line}`;
		if (branch) return `${this.baseUrl}/blob/${branch}/${fileName}${line}`;
		return `${this.baseUrl}?path=${fileName}${line}`;
	}

	protected async onGetPullRequestForCommit(
		{ token }: { token: string },
		ref: string
	): Promise<PullRequest | undefined> {
		const [owner, repo] = this.splitPath();
		return (await Container.github).getPullRequestForCommit(token, owner, repo, ref, { baseUrl: this.apiBaseUrl });
	}
}
