# Reddit Image Downloader
This script will download all the images* in a subreddit to a specified directory locally skipping posts previously downloaded.

**Some restrictions do apply, void where prohibited.*

## Installation
- Run `npm install` to get the requirements sorted.
- copy and rename `example.env` to `.env`, updating information as needed
- run `npm run download` to download all the images from the supplied subreddit

## Notes
This was a quick build to auto-download images from /r/thewholecar to an external drive automatically and while it does work for that purpose it was not extesivly tested. Errors are likely to halt the script without special notice. 

This can be expanded, but it's does what I wanted it to do, so I have no plans expanding it at the moment. If you add a feature in a fork feel free to make a merge request and I'll take a look.

### Adding downloaders
Downloaders are automatically loaded from the `./downloaders/` directory. Downloaders need to be named with the name of the domain* and return a function with the domain appended with 'Downloader' (i.e. `redditDownloader`), see existing for examples. There are probably better ways to handle this, but it worked in the moment.

**first section of the domain name, stop at the first `.`.*