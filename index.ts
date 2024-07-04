import { info, warning, setFailed, getInput, setOutput } from '@actions/core';
import { context, getOctokit } from '@actions/github'
import { readdirSync, statSync } from 'fs';
import { PathLike } from 'node:fs';

type fileWithSize = { file: string, size: number };

function getAllFilesIn(dir: string, allFilesList = []) {

  readdirSync(dir).map(file => {
    const name = dir + "/" + file;
    if(statSync(name).isDirectory() && !name.endsWith('/.git')) {
      getAllFilesIn(name, allFilesList);
    } else {
      if(name.startsWith('.//')) {
        allFilesList.push(name.substring(3));
      } else {
        allFilesList.push(name);
      }
    }
  });
  return allFilesList;
}
async function main() {
  let oversizedFiles: fileWithSize[] = [];

  try {
    let postComment = getInput('post_comment', {required: false}) == "true";
    const githubToken = getInput('github_token', {required: false});

    const wasCalledFromPR = context.payload.pull_request !== undefined;

    if (wasCalledFromPR) {
      if (postComment && !githubToken) {
        warning(`No github_token input was set, but post_comment is set to true.
                  Please either provide a valid github_token or set post_comment to false. Refer to
                  https://github.com/freenet-actions/check-file-size#readme
                  for more information.`);
      }
    } else if (postComment) {
      warning(`The check-file-size action was called in a workflow that was not triggered from a pull_request, but post_comment is set to true.
                Posting comments is only supported in PRs. Refer to
                https://github.com/freenet-actions/check-file-size#readme
                for more information.`);
      postComment = false;
    }

    const maxSizekB = Number(getInput('max_size', {required: false}));

    const ignoredFileText = getInput('ignored_files', {required: false});
    let ignoredFiles: string[] = [];

    if (ignoredFileText) {
      for (const ignoredFilesLine of ignoredFileText.split("\n")) {
        for (const file of ignoredFilesLine.split(",")) {
          ignoredFiles.push(file.trim());
        }
      }
    }

    const files: PathLike[] = getAllFilesIn(getInput('directory', {required: false}));

    const filesWithSize: fileWithSize[] = files.map((file) => ({
      file: file as string,
      size: Math.trunc(statSync(file).size / 1000),
    }))

    oversizedFiles = filesWithSize
        .filter(({file}) => ignoredFiles.find(ignoredFile => file.startsWith(ignoredFile)) === undefined)
        .filter(({size}) => size > maxSizekB);

    const hasFoundOversizedFiles = oversizedFiles.length !== 0;

    const oversizedFilesMessage = oversizedFiles.map(({file, size}) => `* \`${file}\` (${(size.toLocaleString("de-DE"))} kB)`);

    setOutput("has_found_oversized_files", hasFoundOversizedFiles);
    if (hasFoundOversizedFiles) {
      const message = `The following files exceed the maximum allowed file size of ${maxSizekB.toLocaleString("de-DE")} kB:
${oversizedFilesMessage.join('\n')}
\nPlease replace or remove these files in order to merge this PR.`;
      info(message);
      if (postComment) {
        await getOctokit(githubToken).rest.issues.createComment({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          issue_number: context.payload.pull_request.number,
          body: message
        });
      }

      if (getInput('fail_on_find', {required: false}) == "true") {
        if (oversizedFiles.length == 1) {
          setFailed(`The file '${oversizedFiles[0].file}' exceeds the maximum allowed file size.`);
        } else {
          setFailed(`${oversizedFiles.length} files exceed the maximum allowed file size.`);
        }
      }
    }
  } catch (error) {
    setFailed(error);
  }
  setOutput("oversized_files", oversizedFiles);
}

main();
