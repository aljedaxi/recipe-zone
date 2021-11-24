import sanctuary from 'sanctuary'
import {env as flutureEnv} from 'fluture-sanctuary-types'
const S = sanctuary.create ({env: sanctuary.env.concat (flutureEnv), checkTypes: true})
const unchecked = sanctuary.create ({env: sanctuary.env.concat (flutureEnv), checkTypes: false})

export {S, unchecked}
