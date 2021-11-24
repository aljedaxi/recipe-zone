#!/usr/bin/env zx
import {unchecked} from './util.mjs'
const {pipe, prop, ifElse, test} = unchecked
const trace = s => {console.log(s); return s;};

const writeFile = filename => fileData =>
	fs.writeFile (filename, fileData, 'utf8')

const naiveYaml = o => Object.entries (o).map (([k, v]) => `${k}: ${v}`).join('\n')
const fileFormat = metadata => markdown => (
	`${markdown}\n${naiveYaml (metadata)}`
)

// from https://github.com/AberDerBart/recipemd-extract
const pathToRecipeDir = '/Users/daxi/recipe-zone/pages'
export const download = ({filename, metadata = {}}) => url => 
	$`recipemd-extract ${url} -`
		.then (pipe ([
			prop ('stdout'),
			ifElse (test (/Could not extract recipe/)) (Promise.reject) (pipe ([
				fileFormat ({source: url, ...metadata}),
				writeFile (`${pathToRecipeDir}/${filename}`),
			]))
		]))
