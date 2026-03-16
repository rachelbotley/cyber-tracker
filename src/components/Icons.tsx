import type { SVGProps } from 'react'

export type IconProps = SVGProps<SVGSVGElement>

export function SearchIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" {...props}>
      <path d="M480 272q-1 70-40 123l127 126a32 32 0 0 1-46 46L395 440A207 207 0 0 1 64 272a208 208 0 1 1 416 0M272 416a144 144 0 1 0 0-288 144 144 0 0 0 0 288" />
    </svg>
  )
}

export function FolderIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

export function FolderOpenIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 19a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4l2 3h9a2 2 0 0 1 2 2v1" />
      <path d="M5 19h14a2 2 0 0 0 2-2l1-7H8l-1 7a2 2 0 0 1-2 2z" />
    </svg>
  )
}

export function SpeakerIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" {...props}>
      <path d="M112 416h48l134 119a35 35 0 0 0 58-26V131a35 35 0 0 0-58-26L160 224h-48c-26 0-48 22-48 48v96c0 27 22 48 48 48m393-245a24 24 0 1 0-30 37 143 143 0 0 1 0 224c-10 8-12 23-4 34 9 10 24 11 34 3a192 192 0 0 0 0-298m-60 75a24 24 0 1 0-31 37 48 48 0 0 1 0 74c-10 9-11 24-3 34s23 12 34 4a96 96 0 0 0 0-149" />
    </svg>
  )
}
