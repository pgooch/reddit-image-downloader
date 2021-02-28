const fetch = require('node-fetch');
const { filenameCleaner, ensureDirectory, imageDownloader, indexSaver } = require('../index.js');

module.exports = async function imgurDownloader( { title, url }){

	// Get gallery hash from URL
	let galleryHash = url.split('/');
	galleryHash = galleryHash[galleryHash.length-1];

	// Return the promise for the download
	let imageDownloads = [];
	return await new Promise( async( resolve, reject ) => {
		console.log(` Downloading imgur gallery ${galleryHash} to ${title}`)
		
		// Call the API point
		await fetch('https://api.imgur.com/3/album/'+galleryHash, {
		  headers: {
		    'Authorization': 'Client-ID '+process.env.IMGUR_CLIENT_ID
		  }
		}).then( res => res.json() ).then((json)=>{

			// Prepare the markdown file and final save directory
			let markdownIndex = '';
			let finalSaveDirectory = process.env.DESTINATION+title+'/'
			ensureDirectory(finalSaveDirectory)

			// Loop through the images, triggering downloads and building the index
			json.data.images.forEach((image,index)=>{

				// Rname a file so they have a number to keep them in the intended order
				let saveFilename = image.link.split('/');
				saveFilename = index+' '+saveFilename[saveFilename.length-1];

				// Save the file
				imageDownloads.push(imageDownloader(image.link, finalSaveDirectory+saveFilename))

				// Update markdown
				markdownIndex += '![Image '+index+'](./'+saveFilename+')'+"\n";
				if(image.description != null){
					markdownIndex += image.description+"\n\n"
				}else{
					markdownIndex +"\n"
				}
			})

			imageDownloads.push(indexSaver(markdownIndex,finalSaveDirectory+' index.md'))
			Promise.all(imageDownloads).then(() => {
				resolve();
			});
		});
	})
}
