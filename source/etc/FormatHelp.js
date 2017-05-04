"use strict";

let formatHelp = function (doc, tType) {

	if (tType == 'info' && doc) {
		let ans = []

		if (doc.name) ans.push(doc.name)
		//if (doc.nickname) ans.push('My nickname is ' + doc.nickname)
		if (doc.purpose) ans.push(doc.purpose)
		if (doc.business) ans.push(doc.business)

		let address = []
		if (doc.city) address.push(doc.city)
		if (doc.state) address.push(doc.state)
		if (doc.county) address.push(doc.county + ' County')
		if (doc.country) address.push(doc.country)

		return ans.join('\n') + '\n' + address.join(', ')
	} else {
		if (doc && doc.help) {
			return doc.help
		} else {

			let text = []
			text.push('<div class="ui bulleted list help" style="text-align:left;">')
			text.push('<div class="item">Type <span>\'hello\' </span> to see which bot you are talking to or type <span>\'who am I speaking to\'<\span>.</div>')
			text.push('<div class="item">Type <span>\'What is available\'</span> to see what is available from a specific bot.</div>')
			text.push("<div class=\"item\">Type <span>\'Who is available\'</span> to the operator to see what bots are around.</div>")
			text.push("<div class=\"item\">Type <span>'info'</span> to get information about the current bot.</div>")
			text.push("<div class=\"item\">Type <span>'I want to speak with awesome grocery store'</span> to switch to the awesome grocery store bot</div>")
			text.push("<div class=\"item\">Type <span>'help'</span> for each individual bot to get specific help.</div>")
			text.push("<div class=\"item\">Type <span>'show'</span> or <span>'show my list'</span> to show the items stored in your list.</div>")
			text.push("<div class=\"item\">Type <span>'delete my list'</span> or <span>'remove my list'</span> to delete and existing list.</div>")
			text.push("<div class=\"item\">Type <span>'do you have cereal'</span> instead of <span>'cereal'</span> to reduce bot confusion.</div>")
			text.push("<div class=\"item\">Type <span>'how much'</span> or <span>'where'</span> to find how much or where items are.</div>")
			text.push("<div class=\"item\">Click on a result to add it to your list!</div>")
			text.push("<div class=\"item\">Finally, as this is an alpha program, Awesome Store represents a very large store with 100,000 items while Nice Store represents a store with only a couple of hundred.</div></div>")

			return text.join(' ')
		}
	}
}

module.exports = formatHelp;