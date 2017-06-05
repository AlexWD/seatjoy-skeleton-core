let path = require('path');
import { MongoClient } from 'mongodb';
import { ChatConnector, Session, Message, UniversalBot } from 'botbuilder';
import * as builder from 'botbuilder';
import * as express from 'express';
import * as bodyparser from 'body-parser';

interface IOptionsArgs {
    message: string;
}

let connector = new ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// bot
let bot = new UniversalBot(connector);

// dialogs
let intents = new builder.IntentDialog();

bot.dialog('/', intents);

intents
    .matches(/\/getstarted/, '/getstarted') //for testing purposes
    .onDefault('/None')


// root dialogs

bot.dialog('/None', (session: Session, args) => {
    session.send("Sorry, I didn't get that");
    session.replaceDialog('/mainMenu');
})

// Facebook specific dialgos

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


// set the dialog itself.
bot.dialog('/getstarted', [
    (session, args) => {
        resetOrder(session);
        session.send("Welcome %s to Seatjoy food service!", session.message.user.name.split(' ')[0]);
        session.replaceDialog('/mainMenu');
    }
]);

// bot.dialog('/mainMenu', [
//     (session) => {
//         var msg = new builder.Message(session)
//             .attachmentLayout(builder.AttachmentLayout.carousel)
//             .attachments([
//                 new builder.HeroCard(session)
//                     .title("Order food")
//                     .subtitle("Please take a look at our special menu!")
//                     .images([
//                         builder.CardImage.create(session, "http://imagizer.imageshack.us/295x166f/921/MBKvvN.png")
//                             .tap(builder.CardAction.showImage(session, "http://imagizer.imageshack.us/295x166f/921/MBKvvN.png")),
//                     ])
//                     .buttons([
//                         builder.CardAction.dialogAction(session, 'menuOptions', null, 'View')
//                     ])
//             ]);
//         session.endDialog(msg);
//     }
// ]);

bot.dialog('/mainMenu', [
    (session) => {
        var msg = new builder.Message(session)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments([
                new builder.HeroCard(session)
                    .title("Our Menu")
                    .subtitle("We are pleased to offer you a wide-range of menu for lunch or dinner")
                    .images([
                        builder.CardImage.create(session, "https://imagizer.imageshack.us/592x600f/923/yIDwcC.png")
                            .tap(builder.CardAction.showImage(session, "https://imagizer.imageshack.us/592x600f/923/yIDwcC.png")),
                    ])
                    .buttons([
                        builder.CardAction.dialogAction(session, 'regularMenu', null, '🍛 Food 🍱'),
                        builder.CardAction.dialogAction(session, 'moreFoodMenu', null, '🍛 More Food 😋'),
                        builder.CardAction.dialogAction(session, 'specialsMenu', null, 'Specials 🙌😋')

                    ]),
                new builder.HeroCard(session)
                    .title("Drinks & Salads")
                    .subtitle("Have a chill pill")
                    .images([
                        builder.CardImage.create(session, "http://imagizer.imageshack.us/541x392f/923/mXricm.png")
                            .tap(builder.CardAction.showImage(session, "http://imagizer.imageshack.us/541x392f/923/mXricm.png")),
                    ])
                    .buttons([
                        builder.CardAction.dialogAction(session, 'snacksAndDrinksMenu', null, 'Snacks and Drinks ☕'),
                        builder.CardAction.dialogAction(session, 'saladsMenu', null, 'Salads 🥗')
                    ]),
                new builder.HeroCard(session)
                    .title("Hours and Directions")
                    .images([
                        builder.CardImage.create(session, "http://imagizer.imageshack.us/600x450f/924/og9BY2.jpg")
                            .tap(builder.CardAction.showImage(session, "http://imagizer.imageshack.us/600x450f/924/og9BY2.jpg")),
                    ])
                    .buttons([
                        builder.CardAction.dialogAction(session, 'locationsMenu', null, 'Location and Hours'),
                        builder.CardAction.openUrl(session, 'http://www.phatthaisf.com/contact.html', 'Contact')
                    ])
            ]);
        session.endDialog(msg);
    }
]);

bot.dialog('/regularMenu', [
    (session) => {
        session.send('Select your choice:');
        displayItems(session, regularMenuItems);
    }
]);

bot.dialog('/specialsMenu', [
    (session) => {
        session.send('Here are the specials:');
        displayItems(session, specialMenuItems);
    }
]);

bot.dialog('/snacksAndDrinksMenu', [
    (session) => {
        session.send('Appetizer choices:');
        displayItems(session, snacksAndDrinksMenuItems);
    }
]);

bot.dialog('/saladsMenu', [
    (session) => {
        session.send('Salads choices:');
        displayItems(session, saladsMenuItems);
    }
]);

bot.dialog('/moreFoodMenu', [
    (session) => {
        session.send('Thai Stir fried choices:');
        displayItems(session, otherMenuItems);
    }
]);


function displayItems(session: Session, items: IOrderItemDetails[]) {
    let attachments = [];
    items.forEach(item => {
        let card = new builder.HeroCard(session)
            .title(item.itemName + ' - $' + item.price + ' ' + item.title)
            .subtitle(item.description)
            .images([
                builder.CardImage.create(session, item.image)
                    .tap(builder.CardAction.showImage(session, item.image)),
            ])
            .buttons([
                builder.CardAction.dialogAction(session, 'order', JSON.stringify(item), 'Select')
            ]);
        attachments.push(card);
    });
    attachments.push(new builder.HeroCard(session)
        .buttons([
            builder.CardAction.dialogAction(session, 'menuOptions', null, 'Back')
        ]));

    var msg = new builder.Message(session)
        .attachmentLayout(builder.AttachmentLayout.carousel)
        .attachments(attachments);
    session.endDialog(msg);
}

bot.dialog('/selectItemOptions', [
    (session, args) => {
        var item = args as IOrderItemDetails;

        let choices = [];
        item.options.forEach(option => {
            choices.push(option.name + ' $' + option.price);
        });

        builder.Prompts.choice(session, 'Now, select your protein.', choices, { maxRetries: 0 });
    },
    (session, results) => {
        if (results.response) {
            let choiceSelected = session.userData.selectedItem.options[results.response.index];
            session.userData.selectedItem.options = [choiceSelected];
            session.replaceDialog('/order', { data: JSON.stringify(session.userData.selectedItem) });
        }
    }
]);


bot.dialog('/order', [
    (session, args) => {
        let item = JSON.parse(args.data) as IOrderItemDetails;
        session.userData.selectedItem = item;

        if (item.options.length > 1) {
            session.replaceDialog('/selectItemOptions', item);
        }
        else {
            session.userData.orderDetails.items.push(item);
            displayOrderDetails(session, session.userData.orderDetails);
            builder.Prompts.choice(session, 'Please select:', ['Confirm Order', 'Add more items', 'Cancel'], { maxRetries: 0 });
        }
    },
    (session, results) => {
        if (results.response.index == 0) { //'Confirm Order' 
            session.send('Your order is confirmed. Thank you for choosing us!');
            sendReceiptCard(session, session.userData.orderDetails as IOrderDetails);
            resetOrder(session);
            session.replaceDialog('/mainMenu');
        } else if (results.response.index == 1) { //'Add more items' 
            session.replaceDialog('/mainMenu');
        }
        else { //Cancel
            resetOrder(session);
            session.send('Order canceled.');
            session.replaceDialog('/mainMenu');
        }
    }
]);

function displayOrderDetails(session: Session, orderDetails: IOrderDetails) {
    session.userData.orderDetails.totalPrice = 0;

    let msg = '';
    orderDetails.items.forEach(item => {
        session.userData.orderDetails.totalPrice += item.price;

        msg += item.itemName + ' - $' + item.price + '\n\n';
        item.options.forEach(option => {
            msg += option.name + ' - $' + option.price + '\n\n';
            session.userData.orderDetails.totalPrice += option.price;
        });
    });

    msg += '*Total - $' + session.userData.orderDetails.totalPrice + '*';

    /*
        let attachments = [];
        attachments.push(new builder.HeroCard(session)
            .title(orderDetails.itemName + ' - $' + orderDetails.price)
            //.images([builder.CardImage.create(session, orderDetails.image)])
        );
    
        orderDetails.options.forEach(option => {
            attachments.push(new builder.HeroCard(session)
                .title(option.name + ' - $' + option.price));
            session.userData.orderDetails.totalPrice += option.price;
        });
        attachments.push(new builder.HeroCard(session)
            .title('Total - $' + session.userData.orderDetails.totalPrice));
    
        var msg = new builder.Message(session)
            .attachmentLayout(builder.AttachmentLayout.list)
            .attachments(attachments);
        */
    session.send(msg);
}

function sendReceiptCard(session: Session, orderDetails: IOrderDetails) {
    let items = [];

    orderDetails.items.forEach(item => {
        items.push(builder.ReceiptItem.create(session, '$ ' + item.price, item.itemName)
            .quantity('1')
            .image(builder.CardImage.create(session, item.image)));

        item.options.forEach(option => {
            items.push(builder.ReceiptItem.create(session, '$ ' + option.price, option.name)
                .quantity('1')
                .image(builder.CardImage.create(session, '')));
        });
    });

    let card = new builder.ReceiptCard(session)
        .title('Order details')
        .facts([
            builder.Fact.create(session, '1234', 'Order Number')
        ])
        .items(items)
        .tax('$ ' + orderDetails.totalTaxes)
        .total('$ ' + (orderDetails.totalPrice + orderDetails.totalTaxes));


    // attach the card to the reply message
    var msg = new builder.Message(session).addAttachment(card);
    session.send(msg);
}

function resetOrder(session: Session) {
    session.userData.orderDetails = { totalPrice: 0, totalTaxes: 0, items: [] } as IOrderDetails;
}

// hard reset
bot.endConversationAction('forget', 'Converation deleted.', { matches: /^forget/i });

// versioning 
bot.use(builder.Middleware.dialogVersion({ version: 2, resetCommand: /^reset/i }));

if (process.env.DB_URI) {
    MongoClient.connect(process.env.DB_URI).then((db) => {
        startBot(db);
    });
}
else {
    startBot(null);
}

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

var regularMenuItems: IOrderItemDetails[] = [
    {
        itemName: 'Pad Thai',
        title: '',
        description: 'Fresh stir-fried rice noodles with original homemade pad thai sauce, tofu, egg,',
        image: 'http://imagizer.imageshack.us/480x317f/922/MxK7no.png',
        price: 9,
        taxes: 0,
        options: [
            { name: 'Chicken 🐔', price: 1 },
            { name: 'Beef 🍖', price: 1 },
            { name: 'Shrimp 🦐', price: 2 },
            { name: 'Veggie 🍲', price: 0 }
        ]
    },
    {
        itemName: 'Pad Se Eew',
        title: '',
        description: 'Flat rice noodles stir fried in a soy based sauce with eggs, mixed with eggs,',
        image: 'http://imagizer.imageshack.us/461x308f/922/sSX8RA.png',
        price: 9,
        taxes: 0,
        options: [
            { name: 'Chicken 🐔', price: 1 },
            { name: 'Beef 🍖', price: 1 },
            { name: 'Shrimp 🦐', price: 2 },
            { name: 'Veggie 🍲', price: 0 }
        ]
    },
    {
        itemName: 'Green Curry',
        title: '',
        description: 'Curry includes coconut milk,cabbage,carrots,eggplant,beans,squash,basil.',
        image: 'http://imagizer.imageshack.us/480x317f/922/XYV5D1.png',
        price: 9,
        taxes: 0,
        options: [
            { name: 'Chicken 🐔', price: 1 },
            { name: 'Beef 🍖', price: 1 },
            { name: 'Shrimp 🦐', price: 2 },
            { name: 'Veggie 🍲', price: 0 }
        ]
    },
    {
        itemName: 'Yellow Curry',
        title: '',
        description: 'yellow curry sauce with patotoes served with a side of cucumber salad',
        image: 'http://imagizer.imageshack.us/600x450f/922/7Ut6Rt.jpg',
        price: 9,
        taxes: 0,
        options: [
            { name: 'Chicken 🐔', price: 1 },
            { name: 'Beef 🍖', price: 1 },
            { name: 'Shrimp 🦐', price: 2 },
            { name: 'Veggie 🍲', price: 0 }
        ]
    },
    {
        itemName: 'Masamun Curry',
        title: '',
        description: 'Brown curry sauce with coconut milk, onions, potatoes, pineapple, and peanuts',
        image: 'http://imagizer.imageshack.us/600x397f/923/U0Z8ZI.jpg',
        price: 9,
        taxes: 0,
        options: [
            { name: 'Chicken 🐔', price: 1 },
            { name: 'Beef 🍖', price: 1 },
            { name: 'Shrimp 🦐', price: 2 },
            { name: 'Veggie 🍲', price: 0 }
        ]
    }
];

var specialMenuItems: IOrderItemDetails[] = [
    {
        itemName: 'Crispy Pork with Fried Rice',
        title: '',
        description: '',
        image: 'http://imagizer.imageshack.us/600x599f/924/sCC747.jpg',
        price: 11,
        taxes: 0,
        options: []
    },
    {
        itemName: 'Green Curry',
        title: '',
        description: '',
        image: 'http://imagizer.imageshack.us/600x397f/923/LRFRMk.jpg',
        price: 11,
        taxes: 0,
        options: [
            { name: 'Chicken 🐔', price: 1 },
            { name: 'Beef 🍖', price: 1 },
            { name: 'Shrimp 🦐', price: 2 },
            { name: 'Veggie 🍲', price: 0 }
        ]
    },
    {
        itemName: 'Massaman Chicken Curry',
        title: '',
        description: '',
        image: 'http://imagizer.imageshack.us/600x397f/924/DHcrEH.jpg',
        price: 11,
        taxes: 0,
        options: []
    }
];

var snacksAndDrinksMenuItems: IOrderItemDetails[] = [
    {
        itemName: 'Thai Iced Coffee',
        title: '',
        description: '',
        image: '',
        price: 3,
        taxes: 0,
        options: []
    },
    {
        itemName: 'Thai Iced Tea',
        title: '',
        description: '',
        image: '',
        price: 3,
        taxes: 0,
        options: []
    },
    {
        itemName: 'Mango Sticky rice',
        title: '',
        description: '',
        image: '',
        price: 3,
        taxes: 0,
        options: []
    },
    {
        itemName: 'Phat Wings',
        title: '',
        description: '',
        image: '',
        price: 3,
        taxes: 0,
        options: []
    },
    {
        itemName: 'Egg Roles',
        title: '',
        description: '',
        image: '',
        price: 3,
        taxes: 0,
        options: []
    }
];

var saladsMenuItems: IOrderItemDetails[] = [
    {
        itemName: 'Cucumber 🥒 Salad',
        title: '',
        description: 'Chopped Cucumber, shredded carrots and red onions dressed sweet vinegar',
        image: 'http://imagizer.imageshack.us/600x397f/922/2pX9tD.jpg',
        price: 3,
        taxes: 0,
        options: []
    },
    {
        itemName: 'Som Tum Salad',
        title: '',
        description: 'Shredded green papaya, carrots, cherry tomatos, green beans tosted with som tum.',
        image: 'http://imagizer.imageshack.us/600x397f/923/rI9Ivh.jpg',
        price: 6,
        taxes: 0,
        options: [
            { name: 'Chicken 🐔', price: 1 },
            { name: 'Beef 🍖', price: 1 },
            { name: 'Shrimp 🦐', price: 2 },
            { name: 'Veggie 🍲', price: 0 }
        ]
    }
];

var otherMenuItems: IOrderItemDetails[] = [
    {
        itemName: 'Ka Pow',
        title: 'Food Lovers Favorite',
        description: 'Stir fried chicken with Thai basil, bell peppers, and Thai chilies served over',
        image: 'http://imagizer.imageshack.us/426x323f/924/tdYL0N.png',
        price: 9,
        taxes: 0,
        options: []
    },
    {
        itemName: 'Pad Ke-Mao',
        title: '',
        description: 'Stir fried flat rice noodles with ground chicken,broccoli cabbage and carrots',
        image: 'http://imagizer.imageshack.us/600x450f/923/fVtxLm.jpg',
        price: 9,
        taxes: 0,
        options: [
            { name: 'Chicken 🐔', price: 1 },
            { name: 'Beef 🍖', price: 1 },
            { name: 'Shrimp 🦐', price: 2 },
            { name: 'Veggie 🍲', price: 0 }
        ]
    },
    {
        itemName: 'Fried Rice',
        title: '',
        description: '',
        image: 'http://imagizer.imageshack.us/600x450f/924/NXWmt5.jpg',
        price: 9,
        taxes: 0,
        options: [
            { name: 'Chicken 🐔', price: 1 },
            { name: 'Beef 🍖', price: 1 },
            { name: 'Shrimp 🦐', price: 2 },
            { name: 'Veggie 🍲', price: 0 }
        ]
    }
]