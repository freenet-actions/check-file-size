# Check File Size

[![LICENSE](https://img.shields.io/github/license/freenet-actions/check-file-size)](https://github.com/freenet-actions/check-file-size/blob/main/LICENSE)

This action checks all files in a configurable directory (recursively) for a configurable maximum file size. It also allows to automatically add a comment to the triggering PR that lists all oversized files.

## Inputs

| name          | description                                                                                                  | default | required |
|---------------|--------------------------------------------------------------------------------------------------------------|---------|----------|
| github_token  | The GitHub token that will be used to create the comment if files exceeded the maximum file size             |         | true*    |
| directory     | The directory that will be recursively checked for oversized files                                           | ./      | false    |
| max_size      | The maximum allowed file size in kilobytes                                                                   | 16000   | false    |
| post_comment  | **(only works with PRs)** Whether the action should post a comment to the PR which lists the oversized files | true    | false    |
| fail_on_find  | Whether the action should fail if files exceeding the maximum file size were found                           | false   | false    |
| ignored_files | A string array of files or directories that should not be checked                                            | ''      | false    |

*github_token is only necessary if `post_comment` is `true`, **which is the default**.

## Outputs

| name                      | description                                                      |
|---------------------------|------------------------------------------------------------------|
| has_found_oversized_files | A boolean that indicates whether oversized files have been found |
| oversized_files           | A string array of the files that exceeded the maximum file size  |

## Permissions

> [!NOTE]
> If `post_comment` is `true`, **which is the default**, workflows using this action **require** the `pull-requests: write` OR the `issues: write` permission.

## Usage

### Checking all files against the default size limit of 16 MB

By default, if oversized files have been found, the job will continue and a comment listing these files will be posted to the PR.

```yaml
uses: freenet-actions/check-file-size@v2 # Please pin a commit hash instead.
with:
  github_token: ${{ secrets.GITHUB_TOKEN }}
```

### Checking all files against the size limit of 32 MB without posting a comment

If oversized files have been found, the job will continue but not post a comment. The files can always be seen in the workflow logs.

```yaml
uses: freenet-actions/check-file-size@v2 # Please pin a commit hash instead.
with:
  max_size: 32000
  post_comment: false
```

### Checking all files in `directory` except for 3 specific ones and 1 specific subdirectory

```yaml
uses: freenet-actions/check-file-size@v2 # Please pin a commit hash instead.
with:
  github_token: ${{ secrets.GITHUB_TOKEN }}
  directory: directory
  ignored_files: |
    directory/file1.json
    directory/file2.png
    directory/directory2/file3.pdf
    directory/ignored/
```

### Example using every input

This example uses a different syntax to define the ignored files. **Both syntaxes are valid**.

```yaml
uses: freenet-actions/check-file-size@v2 # Please pin a commit hash instead.
with:
  github_token: ${{ secrets.GITHUB_TOKEN }}
  directory: ./
  max_size: 16000
  post_comment: true
  fail_on_find: true
  ignored_files: file1.json, directory/file2.png, directory/directory2/file3.pdf
```
