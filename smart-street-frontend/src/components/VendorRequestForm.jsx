import React from "react";
import { useTranslation } from "react-i18next";

export default function VendorRequestForm({
  intent,
  selectedSpaceId,
  pin,
  form,
  setForm,
  requestedRadius,
  setRequestedRadius,
  ownerDefinedRadius,
  handleSubmit,
  saving,
  setPin,
}) {
  const { t } = useTranslation();

  return (
    <div className="bg-white/95 backdrop-blur rounded-xl border border-slate-200 shadow-sm p-4">
      <form className="grid gap-3 md:grid-cols-4 md:items-end" onSubmit={handleSubmit}>
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-700 block mb-1">{t('time_window')}</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              required
              type="datetime-local"
              value={form.startTime}
              onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              required
              type="datetime-local"
              value={form.endTime}
              onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-500">{t('start_end_hint')}</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">{t('radius_m')}</label>
          <input
            type="number"
            min="1"
            step="1"
            value={intent === "OWNER_DEFINED" ? String(ownerDefinedRadius || "") : requestedRadius}
            disabled={intent === "OWNER_DEFINED" || !intent}
            onChange={e => setRequestedRadius(e.target.value)}
            placeholder={intent === "REQUEST_NEW" ? t('radius_placeholder') : ""}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-600"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            {intent === "OWNER_DEFINED"
              ? t('locked_to_owner_radius')
              : t('editable_new_location')}
          </p>
        </div>

        <div>
          <button
            type="submit"
            disabled={
              saving ||
              !intent ||
              (intent === "OWNER_DEFINED" && !selectedSpaceId) ||
              (intent === "REQUEST_NEW" && !pin) ||
              (intent === "REQUEST_NEW" && (!requestedRadius || requestedRadius <= 0))
            }
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {saving ? t('submitting') : t('submit_request')}
          </button>
          {intent === "REQUEST_NEW" && pin && (
            <button
              type="button"
              onClick={() => setPin(null)}
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {t('clear_pin')}
            </button>
          )}
        </div>
      </form>

      {/* Inline guidance */}
      <div className="mt-3 text-xs text-slate-600">
        {intent === "OWNER_DEFINED" && selectedSpaceId && (
          <span>
            {t('owner_defined_guidance')}
          </span>
        )}
        {intent === "REQUEST_NEW" && selectedSpaceId && !pin && (
          <span>
            {t('new_location_guidance')}
          </span>
        )}
      </div>
    </div>
  );
}
