import { Icon, IconProps } from '@chakra-ui/react'

export const LineaIcon: React.FC<IconProps> = (props) => {
  return (
    <Icon viewBox="0 0 97 102" {...props}>
      <svg
        width="97"
        height="102"
        viewBox="0 0 97 102"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clip-path="url(#clip0_20_1654)">
          <path
            d="M80.1886 101.114H0V16.6219H18.3473V84.739H80.1886V101.105V101.114Z"
            fill="#121212"
          />
          <path
            d="M80.1885 32.9879C89.2272 32.9879 96.5544 25.6606 96.5544 16.622C96.5544 7.58337 89.2272 0.256104 80.1885 0.256104C71.1499 0.256104 63.8226 7.58337 63.8226 16.622C63.8226 25.6606 71.1499 32.9879 80.1885 32.9879Z"
            fill="#121212"
          />
        </g>
        <defs>
          <clipPath id="clip0_20_1654">
            <rect
              width="96.5545"
              height="100.858"
              fill="white"
              transform="translate(0 0.256104)"
            />
          </clipPath>
        </defs>
      </svg>
    </Icon>
  )
}
