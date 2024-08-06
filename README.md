# HelpScout Data Exporter

## About

This tool exports data archives from HelpScout, including Docs files as JSON and Mailbox data as JSON with attachments. Please note that this is unmaintained code used for a one-time export. We don't provide support for this, and this repository is not actively monitored.

## Prerequisites

- Node.js (version specified in `.nvmrc`)
- Yarn package manager
- HelpScout API credentials (App ID and Secret for Mailbox export, as well as a regular API key for Docs export)

## Set up

1. Clone this repository
2. Install dependencies:

```
yarn install
```

3. Create a HelpScout app to obtain the App ID and Secret for Mailbox export

4. Create a HelpScout API key for Docs export

## Running

### Exporting Docs

To export HelpScout Docs, use the following command:

```
HELPSCOUT_KEY="your_api_key" yarn export-docs
```

This will create a `helpscout_docs.json` file containing all your HelpScout Docs data.

### Exporting Mailbox

To export HelpScout Mailbox data, use the following command:

```
export HELPSCOUT_APP_ID="your_app_id" export HELPSCOUT_APP_SECRET="your_app_secret" yarn export-mailbox
```

This will create a directory `mailbox-exports` and organize your files and attachments by folders corresponding to your HelpScout mailbox names.

## Output

- `mailbox-exports/`: Directory containing Mailbox data and attachments
- `output.log`: Log file for the Mailbox export process

## Customization

You can modify the export scripts (`export-docs.js` and `export-mailbox.js`) to adjust the export process or add additional functionality as needed.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

## Disclaimer

This code is provided as-is, without any warranty or support. Use at your own risk.
