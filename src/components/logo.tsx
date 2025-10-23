import React from 'react'
import Image from 'next/image'

interface LogoProps {
  className?: string
  width?: number
  height?: number
  priority?: boolean
}

export default function Logo({ 
  className = '', 
  width = 32, 
  height = 32, 
  priority = false 
}: LogoProps) {
  return (
    <Image
      src="/assets/logo.svg"
      alt="Servecta Logo"
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  )
}
