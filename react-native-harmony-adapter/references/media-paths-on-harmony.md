# Media Paths on Harmony

Read this file when image, video, or file-selection flows behave inconsistently on Harmony even though the business logic looks correct.

## Contents

1. Core rule
2. Common symptoms
3. Why this happens on Harmony
4. Recommended path model
5. `react-native-image-picker` guidance
6. Camera guidance
7. Upload and compression guidance
8. Real-world smells

## Core rule

On Harmony, do not assume a single path can safely serve every purpose.

Use separate values for:

- preview or display URI
- upload or compression file path

If you reuse one field for both, you will eventually hit flows where:

- the image renders but upload fails
- upload works but the image does not render
- camera works but gallery does not

## Common symptoms

Typical reports include:

- image is selected from album but thumbnail does not render
- image renders in the picker or modal, but disappears after returning to the previous page
- camera photo uploads correctly, but gallery image upload fails
- console prints paths like `media/Photo/...` and upload fails
- `RNFetchBlob.wrap(...)` fails even though the user clearly selected a valid image
- image compression works for camera files but fails for gallery files

Treat these as path-shape bugs first, not business-page bugs.

## Why this happens on Harmony

Harmony media libraries and Harmony image-picker flows can expose multiple path forms:

- app-cache `file://...` URI suitable for preview
- raw local file path suitable for upload
- media-library or original path strings such as `media/Photo/...`

These forms are not interchangeable.

In practice, the same selected asset may expose:

- a preview-friendly URI in one field
- an original media path in another field

If you upload the preview URI blindly or render the original media path blindly, one of the two flows can fail.

## Recommended path model

Keep two fields in your app-level media object:

- `content`: display URI used by React Native image components
- `realPath`: file path or upload path used by upload, compression, or file APIs

Recommended helpers:

- `ensureDisplayFileUri(...)` for preview
- `resolveUploadFilePath(...)` for upload or compression
- `pickFirstPath(...)` when normalizing multiple candidate fields

Do not keep stripping `file://` inline across pages. Centralize this logic.

## `react-native-image-picker` guidance

When using Harmony image-picker implementations:

- do not assume `originalPath` is the best preview source
- prefer the picker's cached or processed file URI for preview
- preserve the other file path for upload if it is the real readable path

In real Harmony projects, a common pattern is:

- preview uses `uri`
- upload uses resolved `realPath`

If logs show values like `media/Photo/...`, do not pass that string directly into upload code unless you have confirmed the upload layer can read it.

## Camera guidance

Camera flows often behave differently from gallery flows.

For camera captures:

- store a preview-safe URI for display
- also store the original photo path as `realPath`

This matters when:

- a modal shows the captured image correctly
- the previous page fails to re-render the image after "use photo"
- upload succeeds on camera captures but not on gallery selections

## Upload and compression guidance

Before calling upload or compression libraries such as:

- `RNFetchBlob.wrap(...)`
- `react-native-compressor`
- custom file upload SDKs

resolve the upload path first.

Recommended rule:

1. Start from `realPath` if present.
2. Run it through a helper such as `resolveUploadFilePath(...)`.
3. Pass the resolved file path into upload or compression code.

Do not feed display URIs into upload code by default.

Likewise, do not feed raw media-library paths into preview components by default.

## Real-world smells

These usually indicate the app needs a path-model cleanup:

- page code repeatedly does `replace('file://', '')`
- Android and Harmony branches keep adding one-off path hacks
- the store saves only one `content` field for every image flow
- camera flow and gallery flow use different ad hoc transformations
- upload code reads whatever the preview component used

The fix is usually not a new page-level conditional. The fix is to formalize display-path and upload-path handling in one place.
