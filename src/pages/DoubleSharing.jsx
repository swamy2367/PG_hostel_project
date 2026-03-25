import React from 'react'
import RoomAllocation from '../components/RoomAllocation'

export default function DoubleSharing(){
  return (
    <RoomAllocation
      title="Double Sharing Allocation"
      roomType="double"
      capacity={2}
    />
  )
}
