import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import { ensureLibrarySeeds, loadReports } from '../lib/libraryStore';
import { getSelfProfile, listProfiles } from '../lib/profiles';

function formatWhen(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function isChatReport(report) {
  const kind = String(report.kind || '');
  const source = String(report.source || '');
  if (kind === 'kundali' || source === 'kundali' || source === 'chart' || source === 'family') {
    return false;
  }
  return kind === 'chat' || source === 'chat' || source === 'ai' || source === 'human';
}

function sourceLabel(report) {
  if (report.source === 'human' || report.generatedByType === 'live') return 'Human astro';
  if (report.source === 'ai' || report.generatedByType === 'ai') return 'AI astro';
  return report.generatedBy || 'Astro Chat';
}

function downloadReport(report) {
  const body = [
    report.title,
    `For: ${report.memberName}`,
    `Prepared by: ${report.generatedBy || sourceLabel(report)}`,
    `Created: ${report.createdAt}`,
    '',
    report.summary || '',
  ].join('\n');
  const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${String(report.title || 'report')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 48)}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ReportsPage({ onBack }) {
  const self = getSelfProfile();
  ensureLibrarySeeds({ memberName: self.name });
  const [reports] = useState(() => loadReports().filter(isChatReport));
  const [memberFilter, setMemberFilter] = useState('all');
  const members = listProfiles();

  const filtered = useMemo(() => {
    const list =
      memberFilter === 'all'
        ? reports
        : reports.filter((r) => String(r.memberId) === String(memberFilter));
    return [...list].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }, [reports, memberFilter]);

  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach((report) => {
      const day = String(report.createdAt || '').slice(0, 10) || 'Unknown';
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(report);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <Box className="stack-page">
      <Box className="hill-deco" sx={{ opacity: 0.7 }} />
      <Box sx={{ position: 'relative', zIndex: 1, width: 'min(960px, 100%)', margin: '0 auto', padding: '28px 32px 48px' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ color: '#1E1B2E', pl: 0, mb: 2 }}>
          Back to Services
        </Button>

        <Typography component="h2" sx={{ fontSize: 26, fontWeight: 700, color: '#1E1B2E' }}>
          Detailed Reports
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: 15, color: '#3A3550' }}>
          Readings prepared in chat by AI or human astrologers. Print Kundali from the chart page.
        </Typography>

        <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            select
            size="small"
            label="Member"
            value={memberFilter}
            onChange={(event) => setMemberFilter(event.target.value)}
            sx={{ minWidth: 200, bgcolor: '#FFFFFF' }}
          >
            <MenuItem value="all">Everyone</MenuItem>
            {members.map((member) => (
              <MenuItem key={member.id} value={String(member.id)}>
                {member.isSelf ? `${member.name} (You)` : `${member.name} · ${member.relation}`}
              </MenuItem>
            ))}
          </TextField>
          <Chip label={`${filtered.length} reports`} sx={{ bgcolor: '#EFE9F7', color: '#5B3FA0' }} />
        </Box>

        {grouped.length === 0 ? (
          <Box className="panel" sx={{ mt: 3 }}>
            <Typography sx={{ color: '#4A4560' }}>
              No chat reports yet. Ask Astro Chat or a human astrologer about career, marriage,
              health or timing — those readings will collect here.
            </Typography>
          </Box>
        ) : (
          grouped.map(([day, rows]) => (
            <Box key={day} sx={{ mt: 3 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6A6580', mb: 1 }}>
                {day}
              </Typography>
              <Box
                sx={{
                  bgcolor: '#FFFFFF',
                  border: '1px solid #E6DEEF',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Report</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>For</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Prepared by</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>When</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">
                        Download
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((report) => (
                      <TableRow key={report.id} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600, color: '#1E1B2E' }}>
                            {report.title}
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: '#6A6580' }}>
                            {report.summary}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{report.memberName}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <Chip
                            size="small"
                            label={report.generatedBy || sourceLabel(report)}
                            sx={{
                              bgcolor:
                                report.source === 'human' || report.generatedByType === 'live'
                                  ? '#D9F0DC'
                                  : '#EFE9F7',
                              color:
                                report.source === 'human' || report.generatedByType === 'live'
                                  ? '#1E7A36'
                                  : '#5B3FA0',
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', color: '#4A4560', fontSize: 13 }}>
                          {formatWhen(report.createdAt)}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            startIcon={<DownloadIcon />}
                            onClick={() => downloadReport(report)}
                            sx={{ color: '#5B3FA0' }}
                          >
                            Save
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}

export default ReportsPage;
