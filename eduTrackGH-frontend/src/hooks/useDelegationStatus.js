/**

 * Delegation status hook (headteacher & assistant headteacher)

 */



import { useContext } from 'react';

import { DelegationContext } from '../context/delegationContext';



export function useDelegationStatus() {

  const ctx = useContext(DelegationContext);

  if (!ctx) {

    throw new Error('useDelegationStatus must be used within DelegationProvider');

  }

  return ctx;

}


