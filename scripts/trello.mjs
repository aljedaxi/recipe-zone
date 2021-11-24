#!/usr/bin/env zx
import {S, unchecked} from './util.mjs'
import {encaseP, parallel, fork, coalesce} from 'fluture'
import {download as downloadP} from './download.mjs'
import yaml from 'js-yaml'
import title from 'title'

const {K, pipe, parseJson, map, prop, Nothing, Just, justs,
	Left, Right, lefts, rights,
	splitOn,
	chain,
	filter,
	joinWith,
	maybe,
} = S
const keepKeys = keys => unchecked.pipe ([
	Object.entries,
	unchecked.filter (([k,v]) => keys.includes (k)),
	Object.fromEntries,
])

const trace = s => {console.log(s); return s;};

const trelloFilePath = './trello-board.json'

const isUrl = s => /http/.test (s)
const getNameFromUrl = pipe ([
	splitOn ('/'),
	([protocol, _, sitename, ...goodStuff]) => goodStuff,
	chain (splitOn ('-')),
	chain (splitOn ('_')),
	filter (Boolean),
	joinWith (' '),
	title,
])
const getUrlNameAndMeta = listMap => ({attachments, name, desc, idList, ...rest}) =>
	isUrl (name) ? Left ({name: getNameFromUrl (name), url: name, status: listMap[idList]}) 
: isUrl (desc) ? Left ({name, url: desc, status: listMap[idList]}) 
: attachments.some (({url}) => url) ? Left ({
	name,
	url: attachments.filter (({url}) => url)[0].url,
	status: listMap[idList]
})
: Right ({attachments, name, status: listMap[idList], ...rest})

const nameFile = name => `${name.replace(/\s+/g, '-').replace(/---/g, '-')}.md`
const readTrelloJson = unchecked.pipe ([
	parseJson (K (true)),
	map (unchecked.pipe ([
		trello => {
			const {cards, lists} = trello
			const listIdToName = Object.fromEntries (
				lists.map (({id, name}) => [id, name])
			)
			return map (getUrlNameAndMeta (listIdToName)) (cards)
		},
		lefts,
	])),
])

const downloadRecipes = pipe ([
	map (pipe ([
		({name, url, status}) => coalesce (_ => Left ({name, url, status})) (Right) (
			encaseP (
				downloadP ({filename: nameFile (name), metadata: {title: name, url, status}}) 
			) (url)
		),
	])),
	parallel (10),
	fork (console.error) (pipe ([
		lefts,
		trace,
		o => fs.writeFileSync ('lefts.yaml', yaml.dump (o), 'utf8'),
	]))
])

await fs.readFile (`./trelloData.yaml`, 'utf8')
	.then (yaml.load)
	.then (downloadRecipes)
	.catch (console.error)
