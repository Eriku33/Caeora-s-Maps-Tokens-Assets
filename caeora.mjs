// The base token path
const TOKEN_PATH = "modules/caeora-maps-tokens-assets/assets/tokens/";

// A cached dictionary of avalible tokens names
let availableTokenNames = new Object();

// Store a reference to whether artwork is being replaced
let replaceArtwork = false;

/**
 * Initialize the Caeora module on Foundry VTT init
 */
function initialize() {

	// Only support the dnd5e system for this functionality
	if ( game.system.id !== "dnd5e" ) return;

	// Register token replacement setting
	game.settings.register("caeora-maps-tokens-assets", "replaceArtwork", {
		name: "Auto-Replace Actor Artwork",
		hint: "Automatically replace the portrait and token artwork for a NPC Actor when that actor is imported into the game world.",
		scope: "world",
		config: true,
		type: Boolean,
		default: false,
		onChange: replace => replaceArtwork = replace
	});

	replaceArtwork = game.settings.get("caeora-maps-tokens-assets", "replaceArtwork")

	// Handle actor replacement, if the setting is enabled
	Hooks.on("preCreateActor", replaceActorArtwork);

	// Cache available tokens
	cacheAvailableTokens();
}

/**
 * Cache the set of available tokens which can be used to replace artwork to avoid repeated filesystem requests
 * Since all monsters have unique names and no duplicates with different CRs we can avoid doing a CR check for manually creating actors
 */
async function cacheAvailableTokens() {
	const crs = await FilePicker.browse("data", TOKEN_PATH);
	for ( let cr of crs.dirs ) {
		const tokens = await FilePicker.browse("data", cr+"/with-shadows/");
		tokens.files.forEach(t => availableTokenNames[t.split('/').slice(-1)[0].split('.')[0].toLowerCase()]  = t);
	}
}

/**
 * Replace the artwork for a NPC actor with the version from this module
 * Removed CR requirement, allows art to be used when making new tokens from scratch.
 */
function replaceActorArtwork(data, options, userId) {
	if ( !replaceArtwork || (data.type !== "npc")) return;
	const cleanName = data.name.replace(/ /g, "").toLowerCase();
	if ( !cleanName in availableTokenNames ) return;
	const tokenSrc = availableTokenNames[cleanName];
	data.img = tokenSrc;
	data.token = data.token || {};
	data.token.img = tokenSrc;
};



// Initialize module
Hooks.on("init", initialize);
