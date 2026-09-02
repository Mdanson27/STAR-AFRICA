import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';

const input = readline.createInterface({ input: process.stdin, terminal: false });
const [line] = await new Promise((resolve) => input.once('line', (...args) => resolve(args)));
input.close();

const credential = JSON.parse(line);
const dir = process.cwd();
const gitDir = path.join(dir, '.git');
if (!fs.existsSync(gitDir)) await git.init({ fs, dir, defaultBranch: credential.branch });

await git.setConfig({ fs, dir, path: 'user.name', value: 'Star Africa OS Builder' });
await git.setConfig({ fs, dir, path: 'user.email', value: 'builder@star-africa.local' });
await git.add({ fs, dir, filepath: '.' });

const matrix = await git.statusMatrix({ fs, dir });
const hasChanges = matrix.some(([, head, worktree, stage]) => head !== worktree || worktree !== stage);
if (hasChanges || !(await git.listBranches({ fs, dir })).includes(credential.branch)) {
  await git.commit({
    fs,
    dir,
    message: 'Build Star Africa OS enterprise workspace',
    author: { name: 'Star Africa OS Builder', email: 'builder@star-africa.local' },
  });
}

const commitSha = await git.resolveRef({ fs, dir, ref: 'HEAD' });
await git.push({
  fs,
  http,
  dir,
  url: credential.remote_url,
  ref: credential.branch,
  remoteRef: credential.branch,
  force: true,
  headers: { Authorization: `Bearer ${credential.token}` },
});

process.stdout.write(`${commitSha}\n`);
