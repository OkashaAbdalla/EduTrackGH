/**
 * Headteacher panel to delegate duties to assistant
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from '../common';
import { ROUTES } from '../../utils/constants';
import { useDelegationStatus } from '../../hooks/useDelegationStatus';
import { useToast, useConfirm } from '../../context';
import headteacherService from '../../services/headteacherService';

const HeadteacherDelegationPanel = () => {
  const { status, isActing, pendingDelegation, activeDelegation, refresh } = useDelegationStatus();
  const { showToast } = useToast();
  const { requestConfirmation } = useConfirm();
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!status?.hasAssistant && !status?.assistant) {
    return (
      <Card className="p-5 border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          No assistant headteacher is linked to your account. Ask your system admin to create one for your school.
        </p>
      </Card>
    );
  }

  const handleRequest = async () => {
    setSubmitting(true);
    try {
      const res = await headteacherService.requestDelegation(note);
      if (res.success) {
        showToast('Delegation request sent to assistant headteacher', 'success');
        setNote('');
        refresh();
      } else {
        showToast(res.message || 'Failed to send request', 'error');
      }
    } catch {
      showToast('Failed to send delegation request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnd = async () => {
    const ok = await requestConfirmation({
      title: 'End Delegation',
      message: 'End assistant headteacher duties and resume full control?',
      confirmText: 'End Delegation',
      cancelText: 'Cancel',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      const res = await headteacherService.endDelegation();
      if (res.success) {
        showToast('Delegation ended', 'success');
        refresh();
      }
    } catch {
      showToast('Failed to end delegation', 'error');
    }
  };

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Assistant Headteacher</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {status?.assistant?.fullName || 'Assistant'} — delegate duties when you are away
          </p>
        </div>
        <Link
          to={ROUTES.HEADTEACHER_ASSISTANT_CHAT}
          className="text-sm font-medium text-green-600 dark:text-green-400 hover:underline shrink-0"
        >
          Open chat
        </Link>
      </div>

      {isActing && (
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3">
          <p className="text-sm text-green-800 dark:text-green-200 font-medium">Assistant is currently acting on your behalf</p>
          {activeDelegation?.note && (
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">{activeDelegation.note}</p>
          )}
          <Button type="button" onClick={handleEnd} className="mt-3 !bg-red-600 hover:!bg-red-700">
            End Delegation
          </Button>
        </div>
      )}

      {!isActing && pendingDelegation && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Waiting for {status?.assistant?.fullName || 'assistant'} to accept your delegation request.
          </p>
        </div>
      )}

      {!isActing && !pendingDelegation && (
        <div className="space-y-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Optional note (e.g. Going to district meeting until 3pm)"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
          />
          <Button type="button" onClick={handleRequest} disabled={submitting}>
            {submitting ? 'Sending…' : 'I am going away — Request Assistant Cover'}
          </Button>
        </div>
      )}
    </Card>
  );
};

export default HeadteacherDelegationPanel;
