const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const Fuse = require('fuse.js');

const Config = require("./config.js")

const BASE_URL = 'https://wiki.rustclash.com';

async function getItemUrls() {
    const { data } = await axios.get(`${BASE_URL}/group=itemlist`);
    const $ = cheerio.load(data);
    let itemUrls = [];

    $('a.pad').each((i, element) => {
        const itemUrl = $(element).attr('href');
        if (itemUrl) {
            itemUrls.push(`${BASE_URL}${itemUrl}`);
        }
    });
    return itemUrls;
}

async function getCraftingDetails(itemUrl) {
    try {
        const { data } = await axios.get(itemUrl);
        const $ = cheerio.load(data);

        let itemDetails = {};

        const name = $('h1').text().trim();
        const elements = $('#left-column > div.tab-block > div:nth-child(3) > table > tbody > tr');
        const craftTabSelected = $('li[data-name="craft"]').length > 0;
        const element = $(elements[0]);
        
        itemDetails.name = name;
        itemDetails.ingredients = [];

        const itemBoxes = element.find('a.item-box');
        for (let i = 0; i < itemBoxes.length; i++) {
            if (!craftTabSelected) continue;
            const itemElement = $(itemBoxes[i]);
            const ingredientName = itemElement.find('img').attr('alt').trim();
            if (ingredientName.includes("Workbench")) continue;
            const amountText = itemElement.find('.text-in-icon').text().trim();
            const amount = amountText ? parseInt(amountText.replace('×', ''), 10) : 1;
           
            itemDetails.ingredients.push({ ingredientName, amount });
        }

        return itemDetails;
    } catch (error) {
        console.error(`Error fetching details for ${itemUrl}:`, error);
        return null;
    }
}

async function scrapeRecipes() {
    try {
        const itemUrls = await getItemUrls();
        let recipes = [];

        for (let url of itemUrls) {
            const details = await getCraftingDetails(url);
            recipes.push(details);
        }

        fs.writeFileSync('recipes.json', JSON.stringify(recipes, null, 2));
        console.log('Scraping completed and data saved to recipes.json');
    } catch (error) {
        console.error('Error scraping the website:', error);
    }
}

function loadRecipes() {
    const data = fs.readFileSync('recipes.json');
    return JSON.parse(data);
}

function getFuzzyRecipe(query) {
    const recipes = loadRecipes();
    const fuse = new Fuse(recipes, {
        keys: ['name'],
        threshold: 0.3
    });

    const result = fuse.search(query);
    return result.length ? result[0].item : null;
}

function getRecipe(query) {
    const recipes = loadRecipes();
    const aliases = {
        "556": "5.56 Rifle Ammo",
        "55": "5.56 Rifle Ammo",
        "explo": "5.56 Explosive Ammo",
        "pistol": "Pistol Bullet",
        "meds": "Medical Syringe",
        "ak": "Assault Rifle",
        "sar": "Semi-Automatic Rifle",
        "sap": "Semi-Automatic Pistol",
        "mp5": "MP54A",
    };

    const normalizedQuery = aliases[query.toLowerCase()] || query;
    return getFuzzyRecipe(normalizedQuery);
}

(async () => {
    await scrapeRecipes();
    console.log(getRecipe('holosight'));
})();