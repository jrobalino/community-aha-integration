# community-aha-integration

This app is a prototype intended to award ideas to users of the [Front Community](https://community.front.com) when they submit an idea through the AHA portal. The final version of the app will run as a service that:

* Listens for idea creation events from AHA
* Looks up the user in the community to see if they exist
* Awards the user credit for the idea they submitted in AHA

## API documentation

The script calls the following APIs:

* [Insided API](https://api2-eu-west-1.insided.com/docs/) (community)
* [AHA API](https://www.aha.io/api) (idea portal)

You can find specific API endpoint documentation noted as comments in the code.
