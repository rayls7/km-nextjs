import next from 'next'
import { type } from 'os'
import { dirname } from 'path'
import { fileURLToPath } from 'url'


const __filename = fileURLToPath(import.meta.url)
const __dirname =dirname (__filename)

/** @type {import('next').NextConfig} */
const NextConfig = {
  turbopack: {
      root: __dirname,
  },
}

export default NextConfig 