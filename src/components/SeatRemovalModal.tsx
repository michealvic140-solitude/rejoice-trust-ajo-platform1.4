import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { AlertCircle, CheckCircle, Clock, X, Send } from "lucide-react";

interface SeatRemovalModalProps {
  groupId: number;
  groupName: string;
  seatNumber: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SeatRemovalModal({ groupId, groupName, seatNumber, onClose, onSuccess }: SeatRemovalModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await api.post("/api/seat-removal", {
        groupId,
        seatNumber,
        reason,
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to submit removal request");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="glass-card-static rounded-2xl p-6 max-w-md w-full border border-gold/20 animate-scale-in">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-900/20 border border-emerald-600/30 mx-auto mb-4">
            <CheckCircle size={24} className="text-emerald-400" />
          </div>
          <h3 className="text-foreground font-cinzel font-bold text-lg text-center mb-2">Request Submitted!</h3>
          <p className="text-muted-foreground text-sm text-center mb-4">
            Your seat removal request for Seat #{seatNumber} in {groupName} has been submitted. Admin will review it shortly.
          </p>
          <button
            onClick={onClose}
            className="btn-gold w-full py-2.5 rounded-lg font-semibold text-sm"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card-static rounded-2xl p-6 max-w-md w-full border border-gold/20 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-foreground font-cinzel font-bold text-lg">Request Seat Removal</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 p-3 rounded-lg bg-amber-900/15 border border-amber-600/25 flex items-start gap-2">
          <AlertCircle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-amber-400/80 text-xs">
            You're requesting to remove Seat #{seatNumber} from <strong>{groupName}</strong>. Admin approval is required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="luxury-label">Reason for Removal (Optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tell us why you want to remove this seat..."
              className="luxury-input resize-none h-24 text-sm"
            />
            <p className="text-muted-foreground text-[10px] mt-1">Help admin understand your request</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-900/20 border border-red-600/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-glass flex-1 py-2.5 rounded-lg font-semibold text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-gold flex-1 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-obsidian/30 border-t-obsidian rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={14} />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
