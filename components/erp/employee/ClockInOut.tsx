'use client';

/**
 * Clock In/Out Component for Employee Portal
 * Features:
 * - Clock in/out with live timer
 * - Multiple sessions per day support
 * - Warning when clocking out < 8 hours
 * - Shows total hours worked today
 * - Location tracking on clock in/out
 */

import { useState, useEffect } from 'react';
import { clockInAction, clockOutAction } from '@/actions/erp/time-logs';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { toast } from 'react-hot-toast';
import type { TimeLog, TimeLogSummary } from '@/types/erp';
import { getCurrentPosition } from '@/lib/utils/geolocation';

interface ClockInOutProps {
  employeeId: number;
  initialSummary: TimeLogSummary;
}

export default function ClockInOut({
  employeeId,
  initialSummary,
}: ClockInOutProps) {
  const [summary, setSummary] = useState<TimeLogSummary>(initialSummary);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update timer every second when clocked in
  useEffect(() => {
    if (!summary.is_clocked_in || !summary.active_session) {
      setCurrentTime(0);
      return;
    }

    const calculateElapsed = () => {
      try {
        const clockInTimeStr = summary.active_session!.clock_in_time;

        // Parse timestamp - handle both with and without timezone
        let clockInTime: Date;
        if (clockInTimeStr.includes('+') || clockInTimeStr.endsWith('Z')) {
          // Already has timezone info
          clockInTime = new Date(clockInTimeStr);
        } else {
          // No timezone, assume UTC
          clockInTime = new Date(clockInTimeStr + 'Z');
        }

        // Validate the date
        if (isNaN(clockInTime.getTime())) {
          console.error('Invalid clock in time:', clockInTimeStr);
          return 0;
        }

        const now = new Date();
        const diffMs = now.getTime() - clockInTime.getTime();

        // Ensure positive value
        return Math.max(0, diffMs / 1000); // seconds
      } catch (error) {
        console.error('Error calculating elapsed time:', error);
        return 0;
      }
    };

    // Set initial time
    const initialElapsed = calculateElapsed();
    setCurrentTime(initialElapsed);

    // Update every second
    const interval = setInterval(() => {
      setCurrentTime(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [summary.is_clocked_in, summary.active_session]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds) || seconds < 0) {
      return '00:00:00';
    }
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format hours to decimal
  const formatHours = (seconds: number): string => {
    if (!seconds || isNaN(seconds) || seconds < 0) {
      return '0.00';
    }
    return (seconds / 3600).toFixed(2);
  };

  // Calculate total hours including current session
  const getTotalHours = (): number => {
    if (!summary.is_clocked_in) {
      return summary.total_hours_today || 0;
    }
    const currentHours = currentTime / 3600;
    const total = (summary.total_hours_today || 0) + currentHours;
    return isNaN(total) ? 0 : total;
  };

  // Handle clock in
  const handleClockIn = async () => {
    setIsProcessing(true);
    try {
      // Get location first
      let location: { latitude: number; longitude: number; accuracy: number } | undefined;
      
      try {
        const position = await getCurrentPosition();
        location = {
          latitude: position.latitude,
          longitude: position.longitude,
          accuracy: position.accuracy,
        };
        toast.success('Location captured');
      } catch (error: any) {
        // Location failed, but continue with clock in
        console.warn('Location capture failed:', error);
        toast('Location unavailable - clocking in without location', {
          icon: '⚠️',
        });
      }

      const result = await clockInAction(employeeId, location);

      if (result.success) {
        toast.success('Clocked in successfully!');
        // Refresh page to get updated data
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to clock in');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle clock out
  const handleClockOut = async () => {
    const totalHours = getTotalHours();

    // Show warning if less than 8 hours
    if (totalHours < 8) {
      setShowWarningModal(true);
      return;
    }

    await performClockOut();
  };

  // Perform the actual clock out
  const performClockOut = async () => {
    setIsProcessing(true);
    setShowWarningModal(false);

    try {
      // Get location first
      let location: { latitude: number; longitude: number; accuracy: number } | undefined;
      
      try {
        const position = await getCurrentPosition();
        location = {
          latitude: position.latitude,
          longitude: position.longitude,
          accuracy: position.accuracy,
        };
        toast.success('Location captured');
      } catch (error: any) {
        // Location failed, but continue with clock out
        console.warn('Location capture failed:', error);
        toast('Location unavailable - clocking out without location', {
          icon: '⚠️',
        });
      }

      const result = await clockOutAction(employeeId, undefined, location);

      if (result.success) {
        toast.success('Clocked out successfully!');
        // Refresh page to get updated data
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to clock out');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalHours = getTotalHours();
  const isLessThan8Hours = totalHours < 8;

  return (
    <>
      <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6'>
        <h2 className='text-xl font-bold text-white mb-4'>⏰ Time Tracker</h2>

        {/* Current Status */}
        <div className='mb-6'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-sm text-gray-400'>Status:</span>
            <span
              className={`text-sm font-semibold px-3 py-1 rounded-full ${
                summary.is_clocked_in
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              {summary.is_clocked_in ? '🟢 Clocked In' : '⚪ Clocked Out'}
            </span>
          </div>

          {/* Live Timer */}
          {summary.is_clocked_in && (
            <div className='bg-gray-900/50 rounded-lg p-4 mb-4'>
              <p className='text-xs text-gray-400 mb-1'>Current Session</p>
              <div className='text-3xl font-mono font-bold text-cyan-400'>
                {isMounted ? formatTime(currentTime) : '00:00:00'}
              </div>
              <p className='text-xs text-gray-500 mt-1'>
                {isMounted ? formatHours(currentTime) : '0.00'} hours
              </p>
            </div>
          )}

          {/* Total Hours Today */}
          <div className='bg-gray-900/50 rounded-lg p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-400 mb-1'>Total Today</p>
                <p className='text-2xl font-bold text-white'>
                  {isMounted ? totalHours.toFixed(2) : '0.00'} hrs
                </p>
                {isMounted && isLessThan8Hours && (
                  <p className='text-xs text-yellow-400 mt-1'>
                    ⚠️ Pending: {(8 - totalHours).toFixed(2)} hrs
                  </p>
                )}
                {isMounted && !isLessThan8Hours && (
                  <p className='text-xs text-green-400 mt-1'>
                    ✅ Full day complete
                  </p>
                )}
              </div>
              <div className='text-right'>
                <div className='text-xs text-gray-500'>Required</div>
                <div className='text-lg font-semibold text-gray-400'>
                  8.00 hrs
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions Info */}
        {summary.completed_sessions.length > 0 && (
          <div className='mb-6'>
            <p className='text-xs text-gray-400 mb-2'>
              Completed Sessions Today: {summary.completed_sessions.length}
            </p>
            <div className='space-y-2'>
              {summary.completed_sessions.map((session, index) => (
                <div
                  key={session.id}
                  className='bg-gray-900/30 rounded px-3 py-2 text-xs'
                >
                  <div className='flex justify-between text-gray-400'>
                    <span>Session {index + 1}</span>
                    <span className='text-white font-semibold'>
                      {session.total_hours?.toFixed(2) || '0.00'} hrs
                    </span>
                  </div>
                  {isMounted && (
                    <div className='text-gray-500 mt-1'>
                      {new Date(session.clock_in_time).toLocaleTimeString()} -{' '}
                      {session.clock_out_time
                        ? new Date(session.clock_out_time).toLocaleTimeString()
                        : 'In Progress'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className='mt-4'>
          {summary.is_clocked_in ? (
            <Button
              onClick={handleClockOut}
              variant='secondary'
              className='w-full !bg-red-600 hover:!bg-red-700 !outline-red-700 !shadow-red-500'
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : '🔴 Clock Out'}
            </Button>
          ) : (
            <Button
              onClick={handleClockIn}
              variant='primary'
              className='w-full'
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : '🟢 Clock In'}
            </Button>
          )}
        </div>
      </div>

      {/* Warning Modal for < 8 hours */}
      <Modal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        title='⚠️ Incomplete Working Hours'
      >
        <div className='space-y-4'>
          <p className='text-gray-300'>
            You have only worked{' '}
            <strong className='text-yellow-400'>
              {totalHours.toFixed(2)} hours
            </strong>{' '}
            today.
          </p>
          <p className='text-gray-300'>
            Required working hours:{' '}
            <strong className='text-white'>8.00 hours</strong>
          </p>
          <p className='text-gray-300'>
            Pending hours:{' '}
            <strong className='text-red-400'>
              {(8 - totalHours).toFixed(2)} hours
            </strong>
          </p>

          <div className='bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4'>
            <p className='text-sm text-yellow-400'>
              ⚠️ Clocking out before completing 8 hours may be marked as early
              leave or half-day.
            </p>
          </div>

          <div className='flex gap-3'>
            <Button
              onClick={() => setShowWarningModal(false)}
              variant='secondary'
              className='flex-1'
            >
              Cancel
            </Button>
            <Button
              onClick={performClockOut}
              variant='secondary'
              className='flex-1 !bg-red-600 hover:!bg-red-700 !outline-red-700 !shadow-red-500'
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Clock Out Anyway'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
