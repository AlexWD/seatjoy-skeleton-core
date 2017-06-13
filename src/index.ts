let path = require('path');
import { MongoClient } from 'mongodb';
import { ChatConnector, Session, Message, UniversalBot } from 'botbuilder';
import * as builder from 'botbuilder';
import * as express from 'express';
import * as bodyparser from 'body-parser';
import * as request from 'request';
import FB from 'fb';

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

// load data

let fbPageAccessToken = process.env.FB_PAGE_ACCESS_TOKEN; //"EAADSgufZAHN8BADnLrTOylFbdUnNcuY2UlLoWsgAm31hEWzFdGNb7SnZBhBZBamB4dtxvPtWDkC8N3c01Axe7e9IZBp3NgrQUVXVHddo2lqWHwSolN7EoJvIZAJ6qajPidL4DEUFr5nlmNZAFkPuX78FtXUbnEK5DTzjG5ZBZAYSEtGkuFGZAzn7P";

let menuItems = {};

let merchant = {
  merchant_id: process.env.MERCHANT_ID,
  authToken: process.env.MERCHANT_AUTH_TOKEN
}

request({
  url: `https://connect.squareup.com/v1/${merchant.merchant_id}/items`,
  headers: {
    "Authorization": `Bearer ${merchant.authToken}`
  }
}, (error, response, body) => {
  if (error) {
    console.log(error);
  } else {
    let items = JSON.parse(body);
    items.map(item => {
      let cat = item.category ? item.category.name : 'other';

      if (!Array.isArray(menuItems[cat])) {
        menuItems[cat] = [];
      }


      let variations = item.variations.length < 2 ? [] : item.variations.map(variation => {
        return {
          name: variation.name,
          price: variation.price_money ? variation.price_money.amount / 100 : 0
        };
      });

      menuItems[cat].push({
          itemName: item.name,
          title: '',
          description: item.description,
          image: item.master_image ? item.master_image.url : '',
          price: item.variations[0].price_money ? item.variations[0].price_money.amount / 100 : 0,
          taxes: 0,
          options: variations
      });
    });

    setupMenus();
  }
});

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
// bot.beginDialogAction('regularMenu', '/regularMenu');
// bot.beginDialogAction('specialsMenu', '/specialsMenu');
// bot.beginDialogAction('snacksAndDrinksMenu', '/snacksAndDrinksMenu');
// bot.beginDialogAction('saladsMenu', '/saladsMenu');
// bot.beginDialogAction('moreFoodMenu', '/moreFoodMenu');
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
      // FB.api('/' + session.message.user.id, {access_token: fbAccessToken}, (res) => {
      //   console.log('facebook res');
      //   console.log(res);
      // });
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
                    .buttons(Object.keys(menuItems).map((menuCategory => {
                      return builder.CardAction.dialogAction(session, menuCategory + 'Menu', null, '🍛 ' + menuCategory + ' 🍱');
                    }))),
                // new builder.HeroCard(session)
                //     .title("Drinks & Salads")
                //     .subtitle("Have a chill pill")
                //     .images([
                //         builder.CardImage.create(session, "http://imagizer.imageshack.us/541x392f/923/mXricm.png")
                //             .tap(builder.CardAction.showImage(session, "http://imagizer.imageshack.us/541x392f/923/mXricm.png")),
                //     ])
                //     .buttons([
                //         builder.CardAction.dialogAction(session, 'snacksAndDrinksMenu', null, 'Snacks and Drinks ☕'),
                //         builder.CardAction.dialogAction(session, 'saladsMenu', null, 'Salads 🥗')
                //     ]),
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

function setupMenus() {
  for (let menuCategory in menuItems) {
    let subMenu = menuItems[menuCategory];

    bot.beginDialogAction(`${menuCategory}Menu`, `/${menuCategory}Menu`);

    bot.dialog(`/${menuCategory}Menu`, [
      (session) => {
        session.send(`${menuCategory} choices:`);
        displayItems(session, subMenu);
      }
    ]);
  }
}

// bot.dialog('/regularMenu', [
//     (session) => {
//         session.send('Select your choice:');
//         displayItems(session, regularMenuItems);
//     }
// ]);
//
// bot.dialog('/specialsMenu', [
//     (session) => {
//         session.send('Here are the specials:');
//         displayItems(session, specialMenuItems);
//     }
// ]);
//
// bot.dialog('/snacksAndDrinksMenu', [
//     (session) => {
//         session.send('Appetizer choices:');
//         displayItems(session, snacksAndDrinksMenuItems);
//     }
// ]);
//
// bot.dialog('/saladsMenu', [
//     (session) => {
//         session.send('Salads choices:');
//         displayItems(session, saladsMenuItems);
//     }
// ]);
//
// bot.dialog('/moreFoodMenu', [
//     (session) => {
//         session.send('Thai Stir fried choices:');
//         displayItems(session, otherMenuItems);
//     }
// ]);


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

        if (!item) {
          console.log('item undefined');
          resetOrder(session);
          session.send('Order canceled.');
          session.replaceDialog('/mainMenu');
          return;
        }

        let choices = [];
        item.options.forEach(option => {
            choices.push(option.name + ' $' + option.price);
        });

        builder.Prompts.choice(session, `Now, select your ${item.itemName}.`, choices.slice(0, 4), { maxRetries: 0 });
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
        if (!args || !args.data) {
          console.log('Error: args or args data undefined');
        } else {
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
        }

    },
    (session, results) => {
        if (!results.response) {
          console.log('results response was null');
          resetOrder(session);
          session.send('Order canceled.');
          session.replaceDialog('/mainMenu');
          return;
        }
        if (results.response.index == 0) { //'Confirm Order'
            session.send('Your order is confirmed. Thank you for choosing us!');
            sendReceiptCard(session, session.userData.orderDetails as IOrderDetails);
            resetOrder(session);
            //session.replaceDialog('/mainMenu');
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
        if (item.options.length > 0) {
          item.options.forEach(option => {
              msg += option.name + ' - $' + option.price + '\n\n';
              session.userData.orderDetails.totalPrice += option.price;
          });
        } else {
          msg += item.itemName + ' - $' + item.price + '\n\n';
          session.userData.orderDetails.totalPrice += item.price;
        }

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
        if (!item.options.length) {
          items.push(builder.ReceiptItem.create(session, '$ ' + item.price, item.itemName)
              .quantity('1')
              .image(builder.CardImage.create(session, item.image)));
        } else {
          item.options.forEach(option => {
              items.push(builder.ReceiptItem.create(session, '$ ' + option.price, option.name)
                  .quantity('1')
                  .image(builder.CardImage.create(session, '')));
          });
        }
    });

    let card = new builder.ReceiptCard(session)
        .title('Order details')
        .facts([
            builder.Fact.create(session, '1235', 'Order Number')
        ])
        .items(items)
        .tax('$ ' + orderDetails.totalTaxes)
        .total('$ ' + (orderDetails.totalPrice + orderDetails.totalTaxes))
        .buttons([
                   builder.CardAction.openUrl(session, `https://seatjoy-mvp.herokuapp.com/payment/page`, "Pay")
               ]);




    // attach the card to the reply message
    let msg = new builder.Message(session).addAttachment(card);
    session.send(msg);


    let options = {
      url: `https://graph.facebook.com/v2.6/${session.message.user.id}?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=${fbPageAccessToken}`
    };

    let orderItems = JSON.stringify(orderDetails.items);

    request(options, (err, response, body) => {
      if (err) {
        console.log(err);
      } else {
        let data = JSON.parse(body);

        let msg = new builder.Message(session)
            .attachments([
                new builder.HeroCard(session)
                    .text("Pay")
                    .buttons([
                        builder.CardAction.openUrl(
                          session,
                          `https://seatjoy-mvp.herokuapp.com/payment/page?fb_first_name=${data.first_name}&fb_id=${session.message.user.id}&profile_pic=${data.profile_pic}&fb_last_name=${data.last_name}&merchant_id=${merchant.merchant_id}&location_id=${merchant.merchant_id}&items=${orderItems}&price=${orderDetails.totalPrice}`,
                          "Pay")
                    ])
            ]);

        session.send(msg);
      }
    });


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
