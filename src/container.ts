'use strict';
import { commands, ConfigurationChangeEvent, Disposable, ExtensionContext, Uri } from 'vscode';
import { Autolinks } from './annotations/autolinks';
import { FileAnnotationController } from './annotations/fileAnnotationController';
import { LineAnnotationController } from './annotations/lineAnnotationController';
import { clearAvatarCache } from './avatars';
import { GitCodeLensController } from './codelens/codeLensController';
import { Commands, ToggleFileBlameCommandArgs } from './commands';
import { AnnotationsToggleMode, Config, configuration, ConfigurationWillChangeEvent } from './configuration';
import { GitFileSystemProvider } from './git/fsProvider';
import { GitService } from './git/gitService';
import { LineHoverController } from './hovers/lineHoverController';
import { Keyboard } from './keyboard';
import { Logger } from './logger';
import { StatusBarController } from './statusbar/statusBarController';
import { GitDocumentTracker } from './trackers/gitDocumentTracker';
import { GitLineTracker } from './trackers/gitLineTracker';
import { CompareView } from './views/compareView';
import { FileHistoryView } from './views/fileHistoryView';
import { LineHistoryView } from './views/lineHistoryView';
import { RepositoriesView } from './views/repositoriesView';
import { SearchView } from './views/searchView';
import { ViewCommands } from './views/viewCommands';
import { VslsController } from './vsls/vsls';
import { SettingsWebview } from './webviews/settingsWebview';
import { WelcomeWebview } from './webviews/welcomeWebview';

export class Container {
	private static _configsAffectedByMode: string[] | undefined;
	private static _applyModeConfigurationTransformBound:
		| ((e: ConfigurationChangeEvent) => ConfigurationChangeEvent)
		| undefined;

	static initialize(context: ExtensionContext, config: Config) {
		this._context = context;
		this._config = Container.applyMode(config);

		context.subscriptions.push((this._lineTracker = new GitLineTracker()));
		context.subscriptions.push((this._tracker = new GitDocumentTracker()));
		context.subscriptions.push((this._vsls = new VslsController()));

		context.subscriptions.push((this._git = new GitService()));

		// Since there is a bit of a chicken & egg problem with the DocumentTracker and the GitService, initialize the tracker once the GitService is loaded
		this._tracker.initialize();

		context.subscriptions.push((this._fileAnnotationController = new FileAnnotationController()));
		context.subscriptions.push((this._lineAnnotationController = new LineAnnotationController()));
		context.subscriptions.push((this._lineHoverController = new LineHoverController()));
		context.subscriptions.push((this._statusBarController = new StatusBarController()));
		context.subscriptions.push((this._codeLensController = new GitCodeLensController()));
		context.subscriptions.push((this._keyboard = new Keyboard()));
		context.subscriptions.push((this._settingsWebview = new SettingsWebview()));
		context.subscriptions.push((this._welcomeWebview = new WelcomeWebview()));

		if (config.views.compare.enabled) {
			context.subscriptions.push((this._compareView = new CompareView()));
		} else {
			let disposable: Disposable;
			// eslint-disable-next-line prefer-const
			disposable = configuration.onDidChange(e => {
				if (configuration.changed(e, 'views', 'compare', 'enabled')) {
					disposable.dispose();
					context.subscriptions.push((this._compareView = new CompareView()));
				}
			});
		}

		if (config.views.fileHistory.enabled) {
			context.subscriptions.push((this._fileHistoryView = new FileHistoryView()));
		} else {
			let disposable: Disposable;
			// eslint-disable-next-line prefer-const
			disposable = configuration.onDidChange(e => {
				if (configuration.changed(e, 'views', 'fileHistory', 'enabled')) {
					disposable.dispose();
					context.subscriptions.push((this._fileHistoryView = new FileHistoryView()));
				}
			});
		}

		if (config.views.lineHistory.enabled) {
			context.subscriptions.push((this._lineHistoryView = new LineHistoryView()));
		} else {
			let disposable: Disposable;
			// eslint-disable-next-line prefer-const
			disposable = configuration.onDidChange(e => {
				if (configuration.changed(e, 'views', 'lineHistory', 'enabled')) {
					disposable.dispose();
					context.subscriptions.push((this._lineHistoryView = new LineHistoryView()));
				}
			});
		}

		if (config.views.repositories.enabled) {
			context.subscriptions.push((this._repositoriesView = new RepositoriesView()));
		} else {
			let disposable: Disposable;
			// eslint-disable-next-line prefer-const
			disposable = configuration.onDidChange(e => {
				if (configuration.changed(e, 'views', 'repositories', 'enabled')) {
					disposable.dispose();
					context.subscriptions.push((this._repositoriesView = new RepositoriesView()));
				}
			});
		}

		if (config.views.search.enabled) {
			context.subscriptions.push((this._searchView = new SearchView()));
		} else {
			let disposable: Disposable;
			// eslint-disable-next-line prefer-const
			disposable = configuration.onDidChange(e => {
				if (configuration.changed(e, 'views', 'search', 'enabled')) {
					disposable.dispose();
					context.subscriptions.push((this._searchView = new SearchView()));
				}
			});
		}

		context.subscriptions.push(new GitFileSystemProvider());

		context.subscriptions.push(configuration.onWillChange(this.onConfigurationChanging, this));
	}

	private static onConfigurationChanging(e: ConfigurationWillChangeEvent) {
		this._config = undefined;

		if (configuration.changed(e.change, 'outputLevel')) {
			Logger.level = configuration.get('outputLevel');
		}

		if (configuration.changed(e.change, 'defaultGravatarsStyle')) {
			clearAvatarCache();
		}

		if (configuration.changed(e.change, 'mode') || configuration.changed(e.change, 'modes')) {
			if (this._applyModeConfigurationTransformBound === undefined) {
				this._applyModeConfigurationTransformBound = this.applyModeConfigurationTransform.bind(this);
			}
			e.transform = this._applyModeConfigurationTransformBound;
		}
	}

	private static _autolinks: Autolinks;
	static get autolinks() {
		if (this._autolinks === undefined) {
			this._context.subscriptions.push((this._autolinks = new Autolinks()));
		}

		return this._autolinks;
	}

	private static _codeLensController: GitCodeLensController;
	static get codeLens() {
		return this._codeLensController;
	}

	private static _compareView: CompareView | undefined;
	static get compareView() {
		if (this._compareView === undefined) {
			this._context.subscriptions.push((this._compareView = new CompareView()));
		}

		return this._compareView;
	}

	private static _config: Config | undefined;
	static get config() {
		if (this._config === undefined) {
			this._config = Container.applyMode(configuration.get());
		}
		return this._config;
	}

	private static _context: ExtensionContext;
	static get context() {
		return this._context;
	}

	private static _fileAnnotationController: FileAnnotationController;
	static get fileAnnotations() {
		return this._fileAnnotationController;
	}

	private static _fileHistoryView: FileHistoryView | undefined;
	static get fileHistoryView() {
		if (this._fileHistoryView === undefined) {
			this._context.subscriptions.push((this._fileHistoryView = new FileHistoryView()));
		}

		return this._fileHistoryView;
	}

	private static _git: GitService;
	static get git() {
		return this._git;
	}

	private static _github: Promise<import('./github/github').GitHubApi> | undefined;
	static get github() {
		if (this._github === undefined) {
			this._github = this._loadGitHubApi();
		}

		return this._github;
	}

	private static async _loadGitHubApi() {
		return new (await import(/* webpackChunkName: "github" */ './github/github')).GitHubApi();
	}

	private static _keyboard: Keyboard;
	static get keyboard() {
		return this._keyboard;
	}

	private static _lineAnnotationController: LineAnnotationController;
	static get lineAnnotations() {
		return this._lineAnnotationController;
	}

	private static _lineHistoryView: LineHistoryView | undefined;
	static get lineHistoryView() {
		if (this._lineHistoryView === undefined) {
			this._context.subscriptions.push((this._lineHistoryView = new LineHistoryView()));
		}

		return this._lineHistoryView;
	}

	private static _lineHoverController: LineHoverController;
	static get lineHovers() {
		return this._lineHoverController;
	}

	private static _lineTracker: GitLineTracker;
	static get lineTracker() {
		return this._lineTracker;
	}

	private static _repositoriesView: RepositoriesView | undefined;
	static get repositoriesView(): RepositoriesView {
		if (this._repositoriesView === undefined) {
			this._context.subscriptions.push((this._repositoriesView = new RepositoriesView()));
		}

		return this._repositoriesView;
	}

	private static _searchView: SearchView | undefined;
	static get searchView() {
		if (this._searchView === undefined) {
			this._context.subscriptions.push((this._searchView = new SearchView()));
		}

		return this._searchView;
	}

	private static _settingsWebview: SettingsWebview;
	static get settingsWebview() {
		return this._settingsWebview;
	}

	private static _statusBarController: StatusBarController;
	static get statusBar() {
		return this._statusBarController;
	}

	private static _tracker: GitDocumentTracker;
	static get tracker() {
		return this._tracker;
	}

	private static _viewCommands: ViewCommands | undefined;
	static get viewCommands() {
		if (this._viewCommands === undefined) {
			this._viewCommands = new ViewCommands();
		}
		return this._viewCommands;
	}

	private static _vsls: VslsController;
	static get vsls() {
		return this._vsls;
	}

	private static _welcomeWebview: WelcomeWebview;
	static get welcomeWebview() {
		return this._welcomeWebview;
	}

	private static applyMode(config: Config) {
		if (!config.mode.active) return config;

		const mode = config.modes[config.mode.active];
		if (mode == null) return config;

		if (mode.annotations != null) {
			let command: string | undefined;
			switch (mode.annotations) {
				case 'blame':
					config.blame.toggleMode = AnnotationsToggleMode.Window;
					command = Commands.ToggleFileBlame;
					break;
				case 'heatmap':
					config.heatmap.toggleMode = AnnotationsToggleMode.Window;
					command = Commands.ToggleFileHeatmap;
					break;
				case 'recentChanges':
					config.recentChanges.toggleMode = AnnotationsToggleMode.Window;
					command = Commands.ToggleFileRecentChanges;
					break;
			}

			if (command !== undefined) {
				const commandArgs: ToggleFileBlameCommandArgs = {
					on: true
				};
				// Make sure to delay the execution by a bit so that the configuration changes get propegated first
				setTimeout(() => commands.executeCommand(command!, commandArgs), 50);
			}
		}

		if (mode.codeLens != null) {
			config.codeLens.enabled = mode.codeLens;
		}

		if (mode.currentLine != null) {
			config.currentLine.enabled = mode.currentLine;
		}

		if (mode.hovers != null) {
			config.hovers.enabled = mode.hovers;
		}

		if (mode.statusBar != null) {
			config.statusBar.enabled = mode.statusBar;
		}

		if (mode.views != null) {
			config.views.compare.enabled = mode.views;
		}
		if (mode.views != null) {
			config.views.fileHistory.enabled = mode.views;
		}
		if (mode.views != null) {
			config.views.lineHistory.enabled = mode.views;
		}
		if (mode.views != null) {
			config.views.repositories.enabled = mode.views;
		}
		if (mode.views != null) {
			config.views.search.enabled = mode.views;
		}

		return config;
	}

	private static applyModeConfigurationTransform(e: ConfigurationChangeEvent): ConfigurationChangeEvent {
		if (this._configsAffectedByMode === undefined) {
			this._configsAffectedByMode = [
				`gitlens.${configuration.name('mode')}`,
				`gitlens.${configuration.name('modes')}`,
				`gitlens.${configuration.name('blame', 'toggleMode')}`,
				`gitlens.${configuration.name('codeLens')}`,
				`gitlens.${configuration.name('currentLine')}`,
				`gitlens.${configuration.name('heatmap', 'toggleMode')}`,
				`gitlens.${configuration.name('hovers')}`,
				`gitlens.${configuration.name('recentChanges', 'toggleMode')}`,
				`gitlens.${configuration.name('statusBar')}`,
				`gitlens.${configuration.name('views', 'compare')}`,
				`gitlens.${configuration.name('views', 'fileHistory')}`,
				`gitlens.${configuration.name('views', 'lineHistory')}`,
				`gitlens.${configuration.name('views', 'repositories')}`,
				`gitlens.${configuration.name('views', 'search')}`
			];
		}

		const original = e.affectsConfiguration;
		return {
			...e,
			affectsConfiguration: (section: string, resource?: Uri) => {
				if (this._configsAffectedByMode && this._configsAffectedByMode.some(n => section.startsWith(n))) {
					return true;
				}

				return original(section, resource);
			}
		};
	}
}
