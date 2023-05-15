import process from 'process';
import fs from 'fs'
import express from 'express';

import authRoute from './routes/auth';
import userRoute from './routes/user';
import vendorRoute from './routes/vendor';
import productsRoute from './routes/products';
import imagesRoute from './routes/images'
import { closeConnection } from './services/mongodb';

import { sendErrorMessage, CONSTANTS } from './utils';

const { hostname, port } = JSON.parse(fs.readFileSync('./server.config.json').toString());
const app = express();

app.use('/auth', authRoute);
app.use('/user', userRoute);
app.use('/vendor', vendorRoute);
app.use('/products', productsRoute);
app.use('/images', imagesRoute);
app.use('/', (req, res, next) => {
    res.status(404).json({
        message: CONSTANTS.ERROR_404
    });
});

// catch all uncaught errors
app.use((err, req, res, next) => {
    sendErrorMessage(res, 500, CONSTANTS.ERROR_500, err);
});

app.listen(port, hostname, () => {
    console.log(`Server running at ${hostname}:${port}/`);
});

process.on('SIGINT', () => {
    closeConnection().finally(() => { 
        fs.writeFileSync('./LOGS.txt', `SIGINT PROCESS KILLED WITH PID ${process.pid}\n`, {
            flag: 'a'
        });
        process.exit();
    });
});

process.on('SIGUSR2', () => {
    closeConnection().finally(() => {
        fs.writeFileSync('./LOGS.txt', `SIGUSR2 PROCESS KILLED WITH PID ${process.pid}\n`, {
            flag: 'a'
        });
        process.exit();
    });
});