"use strict"

let GenerateObject = require('sb/phrasex/GenerateObject.js')

describe("Testing GenerateObject", function () {

    it("Should be able to generate objects from data with wildcards", function (done) {
      
        let go = new GenerateObject();

        let description = "(item):(column)";
        let wc = {item : "tuna", column : "aisle", value : "1"}

        let elem = go.expandElement(wc, description)
        expect(elem.val[0]).toEqual('tuna')
        expect(elem.val[1]).toEqual('aisle')

        console.log(elem)

        let elemVal = go.setElement(wc, elem.val, "(value)")

        expect(elemVal).toBe("1");
        console.log(elemVal)

        console.log('obj',go.getObj())
        expect(go.getObj().tuna.aisle).toBe("1")
        console.log('elem',elem.val)
        //Now that we set the object, lets get it
        console.log('verify',go.getElement(elem.val))
        expect(go.getElement(elem.val)).toBe("1")

        done();
    }, 10000);

    it("Should be able to generate objects from data without wildcards", function (done) {
      
        let go = new GenerateObject();

        let description = "item:column";
        let wc = {item : "tuna", column : "aisle"}

        let telem = go.expandElement(wc, description)
        let elem = telem.val

        expect(elem[0]).toEqual('item')
        expect(elem[1]).toEqual('column')

        console.log(elem)

        let elemVal = go.setElement(wc, elem, 1)

        expect(elemVal).toBe(1);
        console.log(elemVal)

        console.log(go.getObj())
        expect(go.getObj().item.column).toBe(1)
        expect(go.getElement(elem)).toBe(1)

        done();
    }, 10000);

    it("Test with multiple cases", function (done) {
      
        let go = new GenerateObject();

        go.insertElement(
            {item : "tuna",column : "aisle"}, 
            "(item):(column)", 10)

        go.insertElement(
            {item : "tuna", column : "price"}, 
            "(item):(column)", 2.05)

        go.insertElement(
            {item : "tuna", column : "id"}, 
            "(item):(column)", "thisId")    

        expect(go.getObj().tuna.aisle).toBe(10);
        expect(go.getObj().tuna.price).toBe(2.05);
        expect(go.getObj().tuna.id).toBe('thisId');

        done();
    }, 10000);

    it("Make sure null data is not inserted", function (done) {
      
        let go = new GenerateObject();

        go.insertElement(
            {item : "tuna",column : "aisle"}, 
            "(item):(column)", null)

            go.insertElement(
            {item : "flounder", column : "aisle"}, 
            "(item):(column)", 2)

        go.insertElement(
            {item : "flounder", column : "price"}, 
            "(item):(column)", null)

        go.insertElement(
            {item : "salmon", column : "id"}, 
            "(item):(column)", null)    

        expect(go.getObj().tuna).toBeFalsy();
        expect(go.getObj().flounder.price).toBeFalsy();
        expect(go.getObj().flounder.aisle).toBe(2);
        expect(go.getObj().salmon).toBeFalsy();

        done();
    }, 10000);

    it("Insert with intents", function (done) {
      
        let go = new GenerateObject();

        go.insertElement(
            {item : "tuna",column : "aisle"}, 
            "(item):(column)", 10,"place")

        go.insertElement(
            {item : "tuna", column : "cost"}, 
            "(item):(column)", 2.05,"price")

        go.insertElement(
            {item : "tuna", column : "id"}, 
            "(item):(column)", "thisId","id")    

        console.log(go.getObj())

        //Make sure we haven't screwd this up
        expect(go.getObj().tuna.aisle).toBe(10);
        expect(go.getObj().tuna.cost).toBe(2.05);
        expect(go.getObj().tuna.id).toBe('thisId');

        //Check that the intents are there
        expect(go.getObj()._place.aisle).toBe(true);
        expect(go.getObj()._price.cost).toBe(true);
        expect(go.getObj()._id.id).toBe(true);

        //Now, lets get information with intents!
        let ans0 = go.getElement(['tuna'],'place')
        let ans1 = go.getElement(['tuna'],'price')
        let ans2 = go.getElement(['tuna'],'_id')

        console.log(ans0,ans1,ans2)
        expect(ans0).toBe(10);
        expect(ans1).toBe(2.05);
        expect(ans2).toBe(null)

        done();
    }, 10000);

    it("Test object flattening", function (done) {
      
        let go = new GenerateObject();

        go.insertElement(
            {item : "tuna",column : "aisle"}, 
            "(item):(column)", 10,"place")

        let ans = go.completeArray(['tuna'],'place')
        console.log(ans)
        let wc = {}
        go.flattenedObject("(item):(column)","(value)",ans.val,wc)

        console.log('wc',wc)
        expect(wc.item).toBe('tuna')
        expect(wc.column).toBe('aisle')
        expect(wc.value).toBe(10)

        console.log(go.getObj())

        done();
    }, 10000);

    it("Test object flattening with two insertions", function (done) {
      
        let go = new GenerateObject();

        go.insertElement(
            {item : "tuna"}, 
            "(item):in", "the ocean","place")
        go.insertElement(
            {item : "tuna", column : "aisle"}, 
            "(item):(column)", 10,"place")
        
        let ans = go.completeArray(['tuna','aisle'],'place')
        console.log(ans)
        let wc = {}
        go.flattenedObject("(item):(column)","(value)",ans.val,wc)

        console.log('wc',wc)
        expect(wc.item).toBe('tuna')
        expect(wc.column).toBe('aisle')
        expect(wc.value).toBe(10)

        ans = go.completeArray(['tuna','in'],'place')
        go.flattenedObject("(item):(column)","(value)",ans.val,wc)

        console.log('wc',wc)
        expect(wc.item).toBe('tuna')
        expect(wc.column).toBe('in')
        expect(wc.value).toBe('the ocean')

        console.log(go.getObj())

        done();
    }, 10000);

    it("Test info insertion and retrieval", function (done) {
      
        let go = new GenerateObject();

        let info = {text : "The tuna is in the ocean may friend", phrase : "The (item) is in the (value)"}
        go.insertElement(
            {item : "tuna"}, 
            "(item):in", "the ocean","place", info)
        

        console.log(go.getObj())
        console.log(go.getInfo())

        let nInfo = go.getInfo();
        expect(nInfo.tuna.in.text).toBe(info.text)
        expect(nInfo.tuna.in.phrase).toBe(info.phrase)
        expect(nInfo.tuna.in.val).toBe('the ocean')
        

        done();
    }, 10000);

    it("Test that it is independent of capitalization", function (done) {
      
        let go = new GenerateObject();

        let info = {text : "The tuna is in the ocean may friend", phrase : "The (item) is in the (value)"}
        go.insertElement(
            {item : "Tuna"}, 
            "(item):in", "the ocean","place", info)
        

        console.log(go.getObj())
        console.log(go.getInfo())

        let nInfo = go.getInfo();
        expect(nInfo.tuna.in.text).toBe(info.text)
        expect(nInfo.tuna.in.phrase).toBe(info.phrase)
        expect(nInfo.tuna.in.val).toBe('the ocean')
        

        done();
    }, 10000);

});