"use strict";

let BroHello = ["about it", "a-yo", "greets", "holla", "how do?", "how goes it",
    "how living", "how's it hanging?", "howsyamomanem", "how ya goin", "howzit killer",
    "sup", "sup, b?", "wassap", "wassup", "wassuper", "what ho", "what is the scene",
    "what it be?", "what it do?", "what it is", "what's clicking", "what's cooking?",
    "what's crack-a-lackin'?", "what's crackin'?", "what's cracking?", "What's in the bag?",
    "what's poppin?", "what's shakin'", "what's shaking", "what's the dilly?",
    "what's the dizzle?", "what's the haps?", "what's the rumpus?", "what's up", "what up?",
    "wussup", "yello", "yo"]

let StandardGreetings = ["Hey", "Hey man", "Hi", "How’s it going?", "How are you doing?",
    "What’s up?", "What’s new?", "What’s going on?",
    "How’s everything?", "How are things?", "How’s life?",
    "How’s your day?", "How’s your day going?", "Good to see you", "Nice to see you",
    "How do you do?", "How have you been?", "G’day mate!", "Hiya!", "Hello"]

let AllHello = StandardGreetings.concat(BroHello)


module.exports = {
    BroHello: BroHello,
    StarndardGreetings: StandardGreetings,
    AllHello: AllHello
}