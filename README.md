# HP Updates

A node tool using webdriver that updates every HP Tile. It exists in two parts:

execute.js - the main app that does the work
qaqc.js - the follow-up app that checks the work

## Adding new programs
New programs are added in program_updates.json and console_script.js

### program_updates.json
Add the new program content to the program_updates.json file. Following this format:
```javascript
{
	"programs": [
		{
			"title": "Money & Prosperity",
			"title_html": "Money &amp; Prosperity",
			"tile_image": "/cfs-file.ashx/__key/CommunityServer-Components-PostAttachments/00-18-06-44-43/Money_5F00_Prosperity_5F00_Tile.png",
			"update": {
				"target_class": "dream_big",
				"program_name": "Dream Big",
				"program_link": "/api/Redirect?url=https%3A%2F%2Fwellmetricssurveys.secure.force.com%2FEvent%2FCoachingEventCheckin%3Fp%3D%5Be%5D%26cpName%3DDream%20Big%26participantCode%3D%5Bparticipantcode%5D%26eventType%3DIgnite%20Your%20Life",
				"program_desc": "Create a vision for your future and a plan to reach your dreams."
			}
		}
	]
}
```

Note these conventions:
* title = HP Tile title (e.g., Health & Fitness, Money and Prosperity, etc.)
* title_html = escaped HP Tile title (mind your &amp;)
* tile_image = limeade-hosted image link
* update = variables related to HTML inserts in the console_script.js file (e.g., `const registrationLinkHtml ='<a style="text-decoration:underline" href="' + programLink + '" target="_new">' + programName + '</a>';`)


### console_script.js
Brand new programs need to be declared to be added to the (tileDescription) and (lifestyleFundamentalsSidebar or personalPerformanceSidebar).

If the program was already in the tile but unfinished (e.g., "*Coming in 2017"), the program needs to be added into its HTML class placeholder as a link (pulled over from program_updates.json), and the "*Coming in 2017" or '*' needs to be removed.

Placement of program HTML within the tileDescription will be a __fun__ process of inserting relative to existing content. .insertBefore() will be your friend.

### Client Lists
Use the test_clients.json for testing the day before.
Use all_clients.json for the actual update.

execute.js has handy comment switching for the test_ and all_ files. Comment between test_clients and all_clients on these lines when doing trial runs before the final all_clients update.

__Pro-tip__:
Create original_all_clients.json and original_test_clients.json files to work as the source of truth for the client lists. This way, if script fails during the update, the working all_clients.json and test_clients.json files can be edited for the update process, then restored from the original_ files.