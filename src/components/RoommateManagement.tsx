import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useRoommateStore } from '../store/roommateStore';
import { useProfileStore } from '../store/profileStore';

const RoommateManagement: React.FC = () => {
  const { user } = useUser();
  const { roommates, addRoommate } = useRoommateStore();
  const { profile } = useProfileStore();

  const [newRoommate, setNewRoommate] = useState({
    name: '',
    upi_id: '',
    email: '',
    phone: '',
  });

  const handleAddRoommate = () => {
    if (!newRoommate.name || !newRoommate.upi_id || !newRoommate.email) return;
    addRoommate(newRoommate);
    setNewRoommate({ name: '', upi_id: '', email: '', phone: '' });
  };

  const handleUPIPayment = (upiId: string, amount: number) => {
    const paymentUrl = `https://quantxpay.vercel.app/${upiId}/${Math.abs(amount)}`;
    window.open(paymentUrl, '_blank');
  };

  const filteredRoommates = roommates.filter((r) => r.email !== (user?.email || ''));

  const allMembers = [
    {
      id: 'current-user',
      name: profile?.name || user?.email?.split('@')[0] || 'You',
      upi_id: profile?.upi_id || 'Not set',
      email: user?.email || '',
      phone: profile?.full_name || '',
      balance: 0,
      isCurrentUser: true,
      user_id: user?.id || '',
    },
    ...filteredRoommates.map(r => ({ ...r, isCurrentUser: false }))
  ];

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Roommate Management</h2>

      <div className="grid gap-2 mb-4">
        <Input
          placeholder="Name"
          value={newRoommate.name}
          onChange={(e) => setNewRoommate({ ...newRoommate, name: e.target.value })}
        />
        <Input
          placeholder="UPI ID"
          value={newRoommate.upi_id}
          onChange={(e) => setNewRoommate({ ...newRoommate, upi_id: e.target.value })}
        />
        <Input
          placeholder="Email"
          value={newRoommate.email}
          onChange={(e) => setNewRoommate({ ...newRoommate, email: e.target.value })}
        />
        <Input
          placeholder="Phone"
          value={newRoommate.phone}
          onChange={(e) => setNewRoommate({ ...newRoommate, phone: e.target.value })}
        />
        <Button onClick={handleAddRoommate}>Add Roommate</Button>
      </div>

      <h3 className="text-lg font-semibold mt-6 mb-2">Roommates</h3>
      <ul className="space-y-2">
        {allMembers.map((roommate) => (
          <li
            key={roommate.email}
            className={`border rounded p-2 flex justify-between items-center ${
              roommate.isCurrentUser ? 'bg-blue-50' : 'bg-white'
            }`}
          >
            <div>
              <p className="font-semibold">{roommate.name}</p>
              <p className="text-sm">{roommate.email}</p>
              <p className="text-sm">UPI: {roommate.upi_id}</p>
            </div>
            {!roommate.isCurrentUser && (
              <Button
                size="sm"
                onClick={() => handleUPIPayment(roommate.upi_id, roommate.balance)}
              >
                Pay ₹{Math.abs(roommate.balance)}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RoommateManagement;
