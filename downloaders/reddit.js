const fetch = require('node-fetch');
const { filenameCleaner, ensureDirectory, imageDownloader, indexSaver } = require('../index.js');
const he = require('he');

module.exports = async function redditDownloader( post ){

	let imageOrder = post.gallery_data.items.map( item => item.media_id )
	let redditLink = 'https://reddit.com'+post.permalink+'.json';
	console.log(` Downloading from reddit gallery for ${post.title}`)

	// Return the promise for the download
	let imageDownloads = [];
	return await new Promise( async( resolve, reject ) => {
		await fetch(redditLink).then( res => res.json() ).then((json)=>{

			// Prepare the save destination
			let finalSaveDirectory = process.env.DESTINATION+post.title+'/'
			ensureDirectory(finalSaveDirectory)

			// Loop through the ordered list of images
			imageOrder.forEach( (imageId, index) => {
				let imageLink = he.decode(json[0].data.children[0].data.media_metadata[imageId].s.u);
				let saveFilename = index+' '+imageId+'.'+json[0].data.children[0].data.media_metadata[imageId].m.split('/')[1]
				imageDownloads.push(imageDownloader(imageLink, finalSaveDirectory+saveFilename))
			})

			// Once all downloaded fire resolve and get to next
			Promise.all(imageDownloads).then(() => {
				resolve();
			});
		});
	})
}
