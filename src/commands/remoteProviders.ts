'use strict';
import { GitCommit, GitRemote } from '../git/gitService';
import { Command, command, Commands } from './common';
import { Container } from '../container';

export interface ConnectRemoteProviderCommandArgs {
	remote: string;
	repoPath: string;
}

@command()
export class ConnectRemoteProviderCommand extends Command {
	static getMarkdownCommandArgs(args: ConnectRemoteProviderCommandArgs): string;
	static getMarkdownCommandArgs(remote: GitRemote): string;
	static getMarkdownCommandArgs(argsOrRemote: ConnectRemoteProviderCommandArgs | GitRemote): string {
		let args: ConnectRemoteProviderCommandArgs | GitCommit;
		if (GitRemote.is(argsOrRemote)) {
			args = {
				remote: argsOrRemote.id,
				repoPath: argsOrRemote.repoPath
			};
		} else {
			args = argsOrRemote;
		}

		return super.getMarkdownCommandArgsCore<ConnectRemoteProviderCommandArgs>(Commands.ConnectRemoteProvider, args);
	}

	constructor() {
		super(Commands.ConnectRemoteProvider);
	}

	async execute(args?: ConnectRemoteProviderCommandArgs): Promise<any> {
		if (args?.repoPath == null || args?.remote == null) return undefined;

		const remote = (await Container.git.getRemotes(args.repoPath)).find(r => args.remote);
		if (!remote?.provider?.hasApi()) return undefined;

		return remote.provider.connect();
	}
}

export interface DisconnectRemoteProviderCommandArgs {
	remote: string;
	repoPath: string;
}

@command()
export class DisconnectRemoteProviderCommand extends Command {
	static getMarkdownCommandArgs(args: DisconnectRemoteProviderCommandArgs): string;
	static getMarkdownCommandArgs(remote: GitRemote): string;
	static getMarkdownCommandArgs(argsOrRemote: DisconnectRemoteProviderCommandArgs | GitRemote): string {
		let args: DisconnectRemoteProviderCommandArgs | GitCommit;
		if (GitRemote.is(argsOrRemote)) {
			args = {
				remote: argsOrRemote.id,
				repoPath: argsOrRemote.repoPath
			};
		} else {
			args = argsOrRemote;
		}

		return super.getMarkdownCommandArgsCore<DisconnectRemoteProviderCommandArgs>(
			Commands.DisconnectRemoteProvider,
			args
		);
	}

	constructor() {
		super(Commands.DisconnectRemoteProvider);
	}

	async execute(args?: DisconnectRemoteProviderCommandArgs): Promise<any> {
		if (args?.repoPath == null || args?.remote == null) return undefined;

		const remote = (await Container.git.getRemotes(args.repoPath)).find(r => args.remote);
		if (!remote?.provider?.hasApi()) return undefined;

		return remote.provider.disconnect();
	}
}
