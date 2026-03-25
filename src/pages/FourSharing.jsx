import React from 'react'
import RoomAllocation from '../components/RoomAllocation'

export default function FourSharing(){
  return (
    <RoomAllocation
      title="Four Sharing Allocation"
      roomType="four"
      capacity={4}
    />
  )
}
