# Publishing Checklist

Use this checklist before sharing the skill outside the current team.

## 1. Confirm the license

Replace the placeholder `LICENSE` file with the final approved license.

Suggested choices:

- MIT: simplest and most permissive
- Apache-2.0: stronger explicit grant language
- Internal-only: if the skill should stay inside the company

## 2. Re-check for private information

Search the package for:

- personal file paths
- internal repository names
- customer names
- private hostnames
- internal URLs

Recommended command:

```bash
rg -n "/Users|/Volumes|internal|private|customer|corp|company" .
```

## 3. Validate the skill still reads cleanly

Review these files:

- `react-native-harmony-adapter/SKILL.md`
- `react-native-harmony-adapter/references/*`
- `react-native-harmony-adapter/scripts/*`
- `react-native-harmony-adapter/agents/openai.yaml`

## 4. Test installation on another machine or account

Verify that another Codex environment can:

- detect the skill
- load `SKILL.md`
- run the bundled scripts
- use the references successfully

## 5. Add a repository remote and publish

Suggested repository structure:

```text
repo/
├── README.md
├── LICENSE
├── PUBLISHING.md
└── react-native-harmony-adapter/
```

## 6. Share a short usage example

Recommended announcement line:

```text
A reusable Codex skill for adapting React Native and Expo projects to HarmonyOS / OpenHarmony, based on real migration work.
```
