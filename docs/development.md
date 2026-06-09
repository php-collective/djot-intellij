# Development

For local setup, project structure, grammar updates, and testing, see
[CONTRIBUTING.md](../CONTRIBUTING.md). This page covers building and the release
process.

## Building

```bash
./gradlew build
```

## Running (development)

```bash
./gradlew runIde
```

## Publishing

Releases are automated via GitHub Actions. When you push a tag, the plugin is
automatically published to JetBrains Marketplace and a GitHub release is created.

### Release Checklist

1. Update version in `build.gradle.kts`:
   ```kotlin
   version = "X.Y.Z"
   ```

2. Commit the version bump:
   ```bash
   git add build.gradle.kts
   git commit -m "Release X.Y.Z"
   git push
   ```

3. Create and push the tag:
   ```bash
   git tag X.Y.Z
   git push origin X.Y.Z
   ```

4. GitHub Actions will automatically:
   - Build the plugin
   - Publish to JetBrains Marketplace
   - Create a GitHub release with the zip attached

### Manual Publishing

To publish manually:

```bash
PUBLISH_TOKEN="your-token" ./gradlew publishPlugin
```

Get your token at https://plugins.jetbrains.com/author/me/tokens

### Setup

The `PUBLISH_TOKEN` secret must be configured in GitHub repo settings
(Settings → Secrets → Actions).
