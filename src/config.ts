'use strict';
import { TraceLevel } from './logger';

export interface Config {
	autolinks: AutolinkReference[] | null;
	blame: {
		avatars: boolean;
		compact: boolean;
		dateFormat: string | null;
		format: string;
		heatmap: {
			enabled: boolean;
			location: 'left' | 'right';
		};
		highlight: {
			enabled: boolean;
			locations: HighlightLocations[];
		};
		ignoreWhitespace: boolean;
		separateLines: boolean;
		toggleMode: AnnotationsToggleMode;
	};
	currentLine: {
		dateFormat: string | null;
		enabled: boolean;
		format: string;
		scrollable: boolean;
	};
	codeLens: CodeLensConfig;
	debug: boolean;
	defaultDateFormat: string | null;
	defaultDateShortFormat: string | null;
	defaultDateSource: DateSource;
	defaultDateStyle: DateStyle;
	defaultGravatarsStyle: GravatarDefaultStyle;
	gitCommands: {
		closeOnFocusOut: boolean;
		search: {
			matchAll: boolean;
			matchCase: boolean;
			matchRegex: boolean;
			showResultsInView: boolean;
		};
		skipConfirmations: string[];
	};
	heatmap: {
		ageThreshold: number;
		coldColor: string;
		hotColor: string;
		toggleMode: AnnotationsToggleMode;
	};
	hovers: {
		annotations: {
			changes: boolean;
			details: boolean;
			enabled: boolean;
			over: 'line' | 'annotation';
		};
		currentLine: {
			changes: boolean;
			details: boolean;
			enabled: boolean;
			over: 'line' | 'annotation';
		};
		avatars: boolean;
		changesDiff: 'line' | 'hunk';
		detailsMarkdownFormat: string;
		enabled: boolean;
	};
	insiders: boolean;
	keymap: KeyMap;
	liveshare: {
		allowGuestAccess: boolean;
	};
	menus: boolean | MenuConfig;
	mode: {
		active: string;
		statusBar: {
			enabled: boolean;
			alignment: 'left' | 'right';
		};
	};
	modes: { [key: string]: ModeConfig };
	outputLevel: TraceLevel;
	pullRequests: {
		enabled: boolean;
	};
	recentChanges: {
		highlight: {
			locations: HighlightLocations[];
		};
		toggleMode: AnnotationsToggleMode;
	};
	remotes: RemotesConfig[] | null;
	showWhatsNewAfterUpgrades: boolean;
	sortBranchesBy: BranchSorting;
	sortTagsBy: TagSorting;
	statusBar: {
		alignment: 'left' | 'right';
		command: StatusBarCommand;
		dateFormat: string | null;
		enabled: boolean;
		format: string;
		reduceFlicker: boolean;
	};
	strings: {
		codeLens: {
			unsavedChanges: {
				recentChangeAndAuthors: string;
				recentChangeOnly: string;
				authorsOnly: string;
			};
		};
	};
	views: ViewsConfig;
	advanced: AdvancedConfig;
}

export enum AnnotationsToggleMode {
	File = 'file',
	Window = 'window'
}

export interface AutolinkReference {
	prefix: string;
	url: string;
	title?: string;
	ignoreCase?: boolean;
	linkify?: ((text: string) => string) | null;
}

export enum BranchSorting {
	NameDesc = 'name:desc',
	NameAsc = 'name:asc',
	DateDesc = 'date:desc',
	DateAsc = 'date:asc'
}

export enum CodeLensCommand {
	DiffWithPrevious = 'gitlens.diffWithPrevious',
	RevealCommitInView = 'gitlens.revealCommitInView',
	ShowCommitsInView = 'gitlens.showCommitsInView',
	ShowQuickCommitDetails = 'gitlens.showQuickCommitDetails',
	ShowQuickCommitFileDetails = 'gitlens.showQuickCommitFileDetails',
	ShowQuickCurrentBranchHistory = 'gitlens.showQuickRepoHistory',
	ShowQuickFileHistory = 'gitlens.showQuickFileHistory',
	ToggleFileBlame = 'gitlens.toggleFileBlame'
}

export enum CodeLensScopes {
	Document = 'document',
	Containers = 'containers',
	Blocks = 'blocks'
}

export enum CustomRemoteType {
	Bitbucket = 'Bitbucket',
	BitbucketServer = 'BitbucketServer',
	Custom = 'Custom',
	GitHub = 'GitHub',
	GitLab = 'GitLab'
}

export enum DateSource {
	Authored = 'authored',
	Committed = 'committed'
}

export enum DateStyle {
	Absolute = 'absolute',
	Relative = 'relative'
}

export enum FileAnnotationType {
	Blame = 'blame',
	Heatmap = 'heatmap',
	RecentChanges = 'recentChanges'
}

export enum GravatarDefaultStyle {
	Faces = 'wavatar',
	Geometric = 'identicon',
	Monster = 'monsterid',
	MysteryPerson = 'mp',
	Retro = 'retro',
	Robot = 'robohash'
}

export enum HighlightLocations {
	Gutter = 'gutter',
	Line = 'line',
	Overview = 'overview'
}

export enum KeyMap {
	Alternate = 'alternate',
	Chorded = 'chorded',
	None = 'none'
}

export enum StatusBarCommand {
	DiffWithPrevious = 'gitlens.diffWithPrevious',
	DiffWithWorking = 'gitlens.diffWithWorking',
	RevealCommitInView = 'gitlens.revealCommitInView',
	ShowCommitsInView = 'gitlens.showCommitsInView',
	ShowQuickCommitDetails = 'gitlens.showQuickCommitDetails',
	ShowQuickCommitFileDetails = 'gitlens.showQuickCommitFileDetails',
	ShowQuickCurrentBranchHistory = 'gitlens.showQuickRepoHistory',
	ShowQuickFileHistory = 'gitlens.showQuickFileHistory',
	ToggleCodeLens = 'gitlens.toggleCodeLens',
	ToggleFileBlame = 'gitlens.toggleFileBlame'
}

export enum TagSorting {
	NameDesc = 'name:desc',
	NameAsc = 'name:asc',
	DateDesc = 'date:desc',
	DateAsc = 'date:asc'
}

export enum ViewBranchesLayout {
	List = 'list',
	Tree = 'tree'
}

export enum ViewFilesLayout {
	Auto = 'auto',
	List = 'list',
	Tree = 'tree'
}

export enum ViewLocation {
	Explorer = 'explorer',
	GitLens = 'gitlens',
	SourceControl = 'scm'
}

export enum ViewShowBranchComparison {
	Branch = 'branch',
	Working = 'working'
}

export interface AdvancedConfig {
	abbreviatedShaLength: number;
	blame: {
		customArguments: string[] | null;
		delayAfterEdit: number;
		sizeThresholdAfterEdit: number;
	};
	caching: {
		enabled: boolean;
	};
	fileHistoryFollowsRenames: boolean;
	maxListItems: number;
	maxSearchItems: number;
	messages: {
		suppressCommitHasNoPreviousCommitWarning: boolean;
		suppressCommitNotFoundWarning: boolean;
		suppressFileNotUnderSourceControlWarning: boolean;
		suppressGitDisabledWarning: boolean;
		suppressGitVersionWarning: boolean;
		suppressLineUncommittedWarning: boolean;
		suppressNoRepositoryWarning: boolean;
		suppressSupportGitLensNotification: boolean;
	};
	quickPick: {
		closeOnFocusOut: boolean;
	};
	repositorySearchDepth: number;
	similarityThreshold: number | null;
	telemetry: {
		enabled: boolean;
	};
	useSymmetricDifferenceNotation: boolean;
}

export interface CodeLensConfig {
	authors: {
		enabled: boolean;
		command: CodeLensCommand;
	};
	enabled: boolean;
	includeSingleLineSymbols: boolean;
	recentChange: {
		enabled: boolean;
		command: CodeLensCommand;
	};
	scopes: CodeLensScopes[];
	scopesByLanguage: CodeLensLanguageScope[];
	symbolScopes: string[];
}

export interface CodeLensLanguageScope {
	language: string | undefined;
	scopes?: CodeLensScopes[];
	symbolScopes?: string[];
}

export interface CompareViewConfig {
	avatars: boolean;
	enabled: boolean;
	files: ViewsFilesConfig;
	location: ViewLocation;
}

export interface FileHistoryViewConfig {
	avatars: boolean;
	enabled: boolean;
	location: ViewLocation;
}

export interface LineHistoryViewConfig {
	avatars: boolean;
	enabled: boolean;
	location: ViewLocation;
}

export interface MenuConfig {
	editor:
		| false
		| {
				blame: boolean;
				clipboard: boolean;
				compare: boolean;
				details: boolean;
				history: boolean;
				remote: boolean;
		  };
	editorGroup:
		| false
		| {
				compare: boolean;
				history: boolean;
		  };
	editorTab:
		| false
		| {
				clipboard: boolean;
				compare: boolean;
				history: boolean;
				remote: boolean;
		  };
	explorer:
		| false
		| {
				clipboard: boolean;
				compare: boolean;
				history: boolean;
				remote: boolean;
		  };
	scmGroup:
		| false
		| {
				compare: boolean;
				openClose: boolean;
				stash: boolean;
				stashInline: boolean;
		  };
	scmItem:
		| false
		| {
				clipboard: boolean;
				compare: boolean;
				history: boolean;
				remote: boolean;
				stash: boolean;
		  };
}

export interface ModeConfig {
	name: string;
	statusBarItemName?: string;
	description?: string;
	annotations?: 'blame' | 'heatmap' | 'recentChanges';
	codeLens?: boolean;
	currentLine?: boolean;
	hovers?: boolean;
	statusBar?: boolean;
	views?: boolean;
}

export interface RemotesConfig {
	domain: string;
	name?: string;
	protocol?: string;
	type: CustomRemoteType;
	urls?: RemotesUrlsConfig;
}

export interface RemotesUrlsConfig {
	repository: string;
	branches: string;
	branch: string;
	commit: string;
	file: string;
	fileInBranch: string;
	fileInCommit: string;
	fileLine: string;
	fileRange: string;
}

export interface RepositoriesViewConfig {
	autoRefresh: boolean;
	autoReveal: boolean;
	avatars: boolean;
	branches: {
		layout: ViewBranchesLayout;
	};
	compact: boolean;
	enabled: boolean;
	files: ViewsFilesConfig;
	includeWorkingTree: boolean;
	location: ViewLocation;
	showBranchComparison: false | ViewShowBranchComparison;
	showTrackingBranch: boolean;
}

export interface SearchViewConfig {
	avatars: boolean;
	enabled: boolean;
	files: ViewsFilesConfig;
	location: ViewLocation;
}

export interface ViewsConfig {
	fileHistory: FileHistoryViewConfig;
	commitFileDescriptionFormat: string;
	commitFileFormat: string;
	commitDescriptionFormat: string;
	commitFormat: string;
	compare: CompareViewConfig;
	defaultItemLimit: number;
	lineHistory: LineHistoryViewConfig;
	pageItemLimit: number;
	repositories: RepositoriesViewConfig;
	search: SearchViewConfig;
	showRelativeDateMarkers: boolean;
	stashFileDescriptionFormat: string;
	stashFileFormat: string;
	stashDescriptionFormat: string;
	stashFormat: string;
	statusFileDescriptionFormat: string;
	statusFileFormat: string;
}

export interface ViewsFilesConfig {
	compact: boolean;
	layout: ViewFilesLayout;
	threshold: number;
}
