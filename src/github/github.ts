'use strict';
import { graphql } from '@octokit/graphql';
import { Logger } from '../logger';
import { debug } from '../system';
import { PullRequest } from '../git/gitService';
import { PullRequestState } from '../git/models/models';

export class GitHubApi {
	@debug()
	async getPullRequestForCommit(
		token: string,
		owner: string,
		repo: string,
		ref: string,
		options?: {
			baseUrl?: string;
		}
	): Promise<PullRequest | undefined> {
		const cc = Logger.getCorrelationContext();

		try {
			const query = `query pr($owner: String!, $repo: String!, $sha: String!) {
	repository(name: $repo, owner: $owner) {
		object(expression: $sha) {
			... on Commit {
				associatedPullRequests(first: 1, orderBy: {field: UPDATED_AT, direction: DESC}) {
					nodes {
						permalink
						number
						title
						state
						updatedAt
						closedAt
						mergedAt
						repository {
							owner {
								login
							}
						}
					}
				}
			}
		}
	}
}`;

			const variables = { owner: owner, repo: repo, sha: ref };
			Logger.debug(cc, `variables: ${JSON.stringify(variables)}`);

			const rsp = await graphql(query, {
				...variables,
				headers: { authorization: `token ${token}` },
				...options
			});
			const pr = rsp?.repository?.object?.associatedPullRequests?.nodes?.[0] as GitHubPullRequest | undefined;
			if (pr == null) return undefined;
			// GitHub seems to sometimes return PRs for forks
			if (pr.repository.owner.login !== owner) return undefined;

			return new PullRequest(
				pr.number,
				pr.title,
				pr.permalink,
				pr.state === 'MERGED'
					? PullRequestState.Merged
					: pr.state === 'CLOSED'
					? PullRequestState.Closed
					: PullRequestState.Open,
				new Date(pr.updatedAt),
				pr.closedAt == null ? undefined : new Date(pr.closedAt),
				pr.mergedAt == null ? undefined : new Date(pr.mergedAt)
			);
		} catch (ex) {
			Logger.error(ex, cc);
			throw ex;
		}
	}
}

interface GitHubPullRequest {
	permalink: string;
	number: number;
	title: string;
	state: 'OPEN' | 'CLOSED' | 'MERGED';
	updatedAt: string;
	closedAt: string | null;
	mergedAt: string | null;
	repository: {
		owner: {
			login: string;
		};
	};
}
