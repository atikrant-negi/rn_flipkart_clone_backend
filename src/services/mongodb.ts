import { readFileSync } from 'fs';
import { MongoClient, Collection } from 'mongodb';

const collections = {
    users: null,
    vendors: null,
    products: null,
    sessions: null
} as Collections;

const configs = JSON.parse(readFileSync('./server.config.json').toString());
const client = new MongoClient(configs.mongodb_url);

(async () => {
    try { 
        await client.connect();
        const db = client.db(configs.mongodb_dbName);
        collections.users = db.collection('users');
        collections.vendors = db.collection('vendors');
        collections.products = db.collection('products');
        collections.sessions = db.collection('sessions');

        console.log('MONGODB::CONNECTED SUCCESSFULLY\n')
    }
    catch(err) {
        console.log('MONGODB::FAILED TO CONNECT\n');
        throw err;
     }
})();

export const getUsers = () => collections.users;
export const getVendors = () => collections.vendors;
export const getProducts = () => collections.products;
export const getSessions = () => collections.sessions;

export const closeConnection = () => client.close();

export type Collections = {
    users: Collection | null,
    vendors: Collection | null,
    products: Collection | null,
    sessions: Collection | null
};