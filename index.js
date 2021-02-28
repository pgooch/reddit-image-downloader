const { titleCase } = require("title-case");
require('dotenv').config()
const fetch = require('node-fetch');
const he = require('he');
const fs = require('fs');
const util = require('util')
const streamPipeline = util.promisify(require('stream').pipeline)
const path = require("path");

// filenameCleaner used by the downloader
module.exports.filenameCleaner = (string) => {
	return he.decode(string.replace(/[:]/g,' -').replace(/[/]/g,'-'));
}

// ensureDirectory us also used by the downloaders
module.exports.ensureDirectory = (destination) => {
	let directory = destination.split('/')
	delete directory[directory.length-1];
	directory = directory.join('/');
	if( !fs.existsSync(directory) ){
		fs.mkdirSync(directory);
	}
}

// This will actually do the download
module.exports.imageDownloader = async(url,destination) => {
  const res = await fetch(url);
  const fileStream = fs.createWriteStream(destination);
  return await new Promise((resolve, reject) => {
      res.body.pipe(fileStream);
      res.body.on("error", reject);
      fileStream.on("finish", resolve);
    });
}

// This takes the index and saves it to the location
module.exports.indexSaver = (content,location) => {
	return new Promise((resolve, reject)=>{
		fs.writeFileSync(location,content.trim())
		resolve();
	})
}

// Include all the downloaders
fs.readdirSync(path.resolve(__dirname, './downloaders')).forEach(file => {
	if( file.substr(0,1) != '.' ){
		let [name, type] = file.split('.');
		if(type == 'js'){
			global[name+'Downloader'] = require(path.resolve(__dirname, './downloaders/'+file))
		}
	}
});

// Determine the entire URL we want to scrape
const REDDIT_URL = 'https://www.reddit.com/r/'+process.env.SUBREDDIT+'/new/';

// Get a list of all the image directories currenly at the save location
const existingPosts = [];
module.exports.ensureDirectory(process.env.DESTINATION);
fs.readdirSync(process.env.DESTINATION).forEach(file => {
	if( file.substr(0,1) != '.' ){
		existingPosts.push(file);
	}
});

// Output message details what exactly will happen
console.log('Scanning '+REDDIT_URL+' for posts to add to '+process.env.DESTINATION)

// Loop through the data looking for posts that we don't have saved already
const pendingPosts = [];
fetch(REDDIT_URL+'.json?limit='+process.env.LIMIT).then( res => res.json() ).then( json => {

	json.data.children.forEach( ( child, index ) =>{
		let cleanedTitle = module.exports.filenameCleaner(child.data.title)

		// cleanedTitle = titleCase(cleanedTitle.toLowerCase());
		cleanedTitle = cleanedTitle.split(' ').map(( word )=>{
			if( word.replace(/[0-9]+/,'').length <=3 ){
				return word
			}else{
				return titleCase(word.toLowerCase())
			}
		}).join(' ');
		child.data.title = cleanedTitle;

		// if(index>=1 && index<=3){ // for limiting for testing.
		if( existingPosts.indexOf(cleanedTitle)<0 ){

			// First, check if we have a downloader for this domain
			let domainDownloader = child.data.domain.split('.')[0]+'Downloader';
			if( global[domainDownloader] != undefined ){
				pendingPosts.push({
					downloader: global[domainDownloader],
					directoryName: cleanedTitle,
					data: child.data
				});
				console.log(`+ ${cleanedTitle} added to downloads`)

			}else{ // There is no downloader for that domain
				console.log(`!!${cleanedTitle} no downloader for ${child.data.domain}`)
			}
		}else{ // You have already go it
			console.log(`  ${cleanedTitle} already downloaded`)
		}
	})

	// Now that we have posts start downloading, if there are some
	if(pendingPosts.length==0){
		console.log('There are no new posts to download.')
	}else{
		console.log('Starting downloads')
		downloader();
	}
});

// This will download whatever was queued, not async because it bogs heavily on large DLs
function downloader(){
	let thisDownload = pendingPosts.pop();
	if(thisDownload === undefined){
		console.log('Downloading complete.')
	}else{
		thisDownload.downloader(thisDownload.data).then(()=>{
			downloader()
		})
	}
}