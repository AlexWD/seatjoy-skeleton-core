This is a skeleton bot for Seatjoy

**Technical description:**

This is a Node.js proyect written in Typescript that use Bot Framework (botbuilder) to connect to Facebook Messenger channel.
It contains a main file `/src/index.ts`
This file contains every piece of the bot like DB connection, Facebook Messenger channel connection, bot framework dialogs, static data, etc.

To run locally on **Visual Studio Code** it uses `.vscode/launch.json` that contains a script to execute in debug mode.
`.vscode/tasks.json` contains the task to execute during development, in this case if you press `Ctrl + Shift + B`, it will start transpiling Typescript code to Javascript code into `dist` folder.

**Technical documentation:**

`/src/index.ts` code explanation:

This is used to create the `ChatConnector` to the bot in Microsoft Bot Framework [Bot Framework](https://dev.botframework.com/)

`MICROSOFT_APP_ID` and `MICROSOFT_APP_PASSWORD` are the credentials from that instance of the bot in Bot Framework.
```Typescript
let connector = new ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// bot
let bot = new UniversalBot(connector);
```


This code handles default dialog, when none of the options is selected or the bot didn't understand the intent.
```Typescript
bot.dialog('/None', (session: Session, args) => {
    session.send("Sorry, I didn't get that");
    session.replaceDialog('/mainMenu');
})
```

This code declares all dialogs used in the bot
```Typescript
// answer get started postback
bot.beginDialogAction('getstarted', '/getstarted');
//1
bot.beginDialogAction('mainMenu', '/mainMenu');
//1.1
bot.beginDialogAction('menuOptions', '/menuOptions');
bot.beginDialogAction('regularMenu', '/regularMenu');
bot.beginDialogAction('specialsMenu', '/specialsMenu');
bot.beginDialogAction('snacksAndDrinksMenu', '/snacksAndDrinksMenu');
bot.beginDialogAction('saladsMenu', '/saladsMenu');
bot.beginDialogAction('moreFoodMenu', '/moreFoodMenu');
//Order
bot.beginDialogAction('order', '/order');
bot.beginDialogAction('confirmOrder', '/confirmOrder');
```

This is the initial dialog, it executed right after the user clicks `Get Started` button on Messenger
```Typescript
bot.dialog('/getstarted', [
    (session, args) => {
        resetOrder(session);
        session.send("Welcome %s to Seatjoy food service!", session.message.user.name.split(' ')[0]);
        session.replaceDialog('/mainMenu');
    }
]);
```

To implement a dialog workflow you have to use this. In this example the dialog code correspond to `/mainMenu` dialog declared above
```Typescript
bot.dialog('/mainMenu', [
    (session) => {
        //bot code
    }
]);
```

At the end of the file we have all static data used for this skeleton and data structure used for `Orders`:
```Typescript
interface IOrderDetails {
    totalPrice: number,
    totalTaxes: number,
    items: IOrderItemDetails[]
}

interface IOrderItemDetails {
    itemName: string,
    title: string,
    description: string,
    price: number,
    taxes: number,
    image: string,
    options: IOrderOption[]
}

interface IOrderOption {
    name: string,
    price: number
}

var regularMenuItems: IOrderItemDetails[]
var specialMenuItems: IOrderItemDetails[]
var snacksAndDrinksMenuItems: IOrderItemDetails[]
var saladsMenuItems: IOrderItemDetails[]
var otherMenuItems: IOrderItemDetails[]
```

To connect to a `MongoDB` we use this code:
```Typescript
MongoClient.connect(process.env.DB_URI).then((db) => {
        startBot(db);
    });
```


Finally we have `startBot()` function that initiate a `Node Express` instance to listen incoming request to the bot in the `port` set in `process.env.PORT`.

```Typescript
function startBot(db) {
    let server = express()

    server.use(bodyparser.json())

    // this is for localtunnel
    server.get('/', (req, res) => res.send('hello'))

    // Handle Bot Framework messages
    server.post('/api/messages', connector.listen());

    const listener = server.listen(process.env.PORT, function () {

        console.log('Bot started listening on', listener.address().address, listener.address().port);
    })
}
```
