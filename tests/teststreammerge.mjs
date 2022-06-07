import fs from 'fs'
import stream from 'stream'

async function* concatStreams(readables) {
  for (const readable of readables) {
    for await (const chunk of readable) { yield chunk }
  }
}


const files = ['package.json', 'package-lock.json']
const iterable = concatStreams(files.map(f => fs.createReadStream(f)))

// convert the async iterable to a readable stream
const mergedStream = stream.Readable.from(iterable)

mergedStream.pipe(process.stdout)

