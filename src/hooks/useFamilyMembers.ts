import { useEffect, useState } from 'react';
import { useAuthStore } from '@/src/stores/authStore';
import * as familyService from '@/src/services/familyService';
import { User } from '@/src/types';

/**
 * Hook to fetch and cache family members
 * This allows us to efficiently get user names from userIds
 */
export function useFamilyMembers() {
  const { family } = useAuthStore();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!family?.id) {
      setMembers([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchMembers = async () => {
      try {
        setLoading(true);
        const familyMembers = await familyService.getFamilyMembers(family.id);
        if (isMounted) {
          setMembers(familyMembers);
        }
      } catch (error) {
        console.warn('Failed to fetch family members:', error);
        if (isMounted) {
          setMembers([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMembers();

    return () => {
      isMounted = false;
    };
  }, [family?.id]);

  const getUserName = (userId: string): string => {
    const member = members.find((m) => m.id === userId);
    return member?.name || 'Someone';
  };

  const getUserInitials = (userId: string): string => {
    const name = getUserName(userId);
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  return {
    members,
    loading,
    getUserName,
    getUserInitials,
  };
}

