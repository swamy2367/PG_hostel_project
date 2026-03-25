import React from 'react'
import RoomAllocation from '../components/RoomAllocation'

export default function TripleSharing(){
  return (
    <RoomAllocation
      title="Triple Sharing Allocation"
      roomType="triple"
      capacity={3}
    />
  )
}
