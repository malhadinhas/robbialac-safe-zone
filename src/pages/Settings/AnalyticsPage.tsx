import React, { useState, useEffect, useCallback } from 'react';
import {
  getBasicAnalytics,
  getLoginStats,
  getUploadStats,
  getErrorLogs,
  BasicAnalyticsData,
  TimeSeriesStat,
  UploadTimeSeriesStat,
  ErrorLogResponse,
  ErrorLog,
} from '../../services/analyticsService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Terminal, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from 'date-fns';
import { ptBR, enUS, fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

type GroupByPeriod = 'day' | 'week' | 'month' | 'year';

// Função auxiliar para formatar bytes
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Função auxiliar para formatar o período (pode precisar de ajustes)
function formatPeriod(period: any, groupBy: GroupByPeriod): string {
  if (typeof period === 'string') return period; // Se já for string
  switch (groupBy) {
    case 'year': return `${period.year}`;
    case 'month': return `${period.year}-${String(period.month).padStart(2, '0')}`;
    case 'week': return `${period.year}-W${String(period.week).padStart(2, '0')}`;
    case 'day': 
    default: return `${period.year}-${String(period.month).padStart(2, '0')}-${String(period.day).padStart(2, '0')}`;
  }
}

// Mapear códigos de idioma i18next para locales date-fns
const dateLocales: { [key: string]: Locale } = {
  pt: ptBR,
  en: enUS,
  fr: fr,
};

const AnalyticsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLocale = dateLocales[i18n.language] || ptBR;

  // Estados existentes
  const [basicData, setBasicData] = useState<BasicAnalyticsData | null>(null);
  const [loadingBasic, setLoadingBasic] = useState<boolean>(true);
  const [errorBasic, setErrorBasic] = useState<string | null>(null);

  // Novos estados
  const [loginStats, setLoginStats] = useState<TimeSeriesStat[]>([]);
  const [loginGroupBy, setLoginGroupBy] = useState<GroupByPeriod>('day');
  const [loadingLogins, setLoadingLogins] = useState<boolean>(false);
  const [errorLogins, setErrorLogins] = useState<string | null>(null);

  const [uploadStats, setUploadStats] = useState<UploadTimeSeriesStat[]>([]);
  const [uploadGroupBy, setUploadGroupBy] = useState<GroupByPeriod>('day');
  const [loadingUploads, setLoadingUploads] = useState<boolean>(false);
  const [errorUploads, setErrorUploads] = useState<string | null>(null);

  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [errorLogPage, setErrorLogPage] = useState<number>(1);
  const [errorLogTotalPages, setErrorLogTotalPages] = useState<number>(1);
  const [loadingErrors, setLoadingErrors] = useState<boolean>(false);
  const [errorErrors, setErrorErrors] = useState<string | null>(null);

  // Fetch Basic Data
  useEffect(() => {
    const fetchBasicData = async () => {
      try {
        setLoadingBasic(true);
        setErrorBasic(null);
        const data = await getBasicAnalytics();
        setBasicData(data);
      } catch (err: any) { setErrorBasic(err.message); }
      finally { setLoadingBasic(false); }
    };
    fetchBasicData();
  }, []);

  // Fetch Login Stats
  const fetchLoginStats = useCallback(async (groupBy: GroupByPeriod) => {
    try {
      setLoadingLogins(true);
      setErrorLogins(null);
      const data = await getLoginStats(groupBy);
      setLoginStats(data);
    } catch (err: any) { setErrorLogins(err.message); }
    finally { setLoadingLogins(false); }
  }, []);

  useEffect(() => {
    fetchLoginStats(loginGroupBy);
  }, [loginGroupBy, fetchLoginStats]);

  // Fetch Upload Stats
  const fetchUploadStats = useCallback(async (groupBy: GroupByPeriod) => {
    try {
      setLoadingUploads(true);
      setErrorUploads(null);
      const data = await getUploadStats(groupBy);
      setUploadStats(data);
    } catch (err: any) { setErrorUploads(err.message); }
    finally { setLoadingUploads(false); }
  }, []);

  useEffect(() => {
    fetchUploadStats(uploadGroupBy);
  }, [uploadGroupBy, fetchUploadStats]);

  // Fetch Error Logs
  const fetchErrorLogs = useCallback(async (page: number) => {
    try {
      setLoadingErrors(true);
      setErrorErrors(null);
      const data = await getErrorLogs(page);
      setErrorLogs(data.errors);
      setErrorLogPage(data.currentPage);
      setErrorLogTotalPages(data.totalPages);
    } catch (err: any) { setErrorErrors(err.message); }
    finally { setLoadingErrors(false); }
  }, []);

  useEffect(() => {
    fetchErrorLogs(errorLogPage);
  }, [errorLogPage, fetchErrorLogs]);

  // --- Renderização --- 

  const renderErrorAlert = (error: string | null, titleKey: string) => {
    if (!error) return null;
    return (
      <Alert variant="destructive" className="my-4">
        <Terminal className="h-4 w-4" />
        <AlertTitle>{t(titleKey)}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <h1 className="text-2xl font-bold">{t('app_analytics_data')}</h1>
      
      {/* --- Basic Stats --- */}
      <Card>
        <CardHeader>
          <CardTitle>{t('overview')}</CardTitle>
        </CardHeader>
        <CardContent>
          {renderErrorAlert(errorBasic, "error_loading_overview")}
          {loadingBasic ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          ) : basicData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="text-center"><CardHeader><CardTitle>{t('users')}</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{basicData.totalUsers}</p></CardContent></Card>
              <Card className="text-center"><CardHeader><CardTitle>{t('incidents')}</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{basicData.totalIncidents}</p></CardContent></Card>
              <Card className="text-center"><CardHeader><CardTitle>{t('incidents_30d')}</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{basicData.recentIncidentsCount}</p></CardContent></Card>
              <Card className="text-center"><CardHeader><CardTitle>{t('videos')}</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{basicData.totalVideos}</p></CardContent></Card>
            </div>
          ) : (
            <p>{t('no_basic_data')}</p>
          )}
        </CardContent>
      </Card>

      {/* --- Login Stats --- */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{t('login_events')}</CardTitle>
            <Select value={loginGroupBy} onValueChange={(value) => setLoginGroupBy(value as GroupByPeriod)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('group_by')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">{t('day')}</SelectItem>
                <SelectItem value="week">{t('week')}</SelectItem>
                <SelectItem value="month">{t('month')}</SelectItem>
                <SelectItem value="year">{t('year')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {renderErrorAlert(errorLogins, "error_loading_logins")}
          {loadingLogins ? (
            <Skeleton className="h-40" />
          ) : loginStats.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>{t('period')}</TableHead><TableHead className="text-right">{t('logins')}</TableHead></TableRow></TableHeader>
              <TableBody>
                {loginStats.map((stat, index) => (
                  <TableRow key={index}>
                    <TableCell>{formatPeriod(stat.period, loginGroupBy)}</TableCell>
                    <TableCell className="text-right">{stat.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>{t('no_login_data')}</p>
          )}
        </CardContent>
      </Card>

      {/* --- Upload Stats --- */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{t('uploads_performed')}</CardTitle>
            <Select value={uploadGroupBy} onValueChange={(value) => setUploadGroupBy(value as GroupByPeriod)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('group_by')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">{t('day')}</SelectItem>
                <SelectItem value="week">{t('week')}</SelectItem>
                <SelectItem value="month">{t('month')}</SelectItem>
                <SelectItem value="year">{t('year')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {renderErrorAlert(errorUploads, "error_loading_uploads")}
          {loadingUploads ? (
            <Skeleton className="h-40" />
          ) : uploadStats.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>{t('period')}</TableHead><TableHead className="text-right">{t('num_uploads')}</TableHead><TableHead className="text-right">{t('total')}</TableHead></TableRow></TableHeader>
              <TableBody>
                {uploadStats.map((stat, index) => (
                  <TableRow key={index}>
                    <TableCell>{formatPeriod(stat.period, uploadGroupBy)}</TableCell>
                    <TableCell className="text-right">{stat.count}</TableCell>
                    <TableCell className="text-right">{formatBytes(stat.totalSize)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>{t('no_upload_data')}</p>
          )}
        </CardContent>
      </Card>

      {/* --- Error Logs --- */}
      <Card>
        <CardHeader>
          <CardTitle>{t('recent_error_logs')}</CardTitle>
          <CardDescription>{t('error_logs_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {renderErrorAlert(errorErrors, "error_loading_error_logs")}
          {loadingErrors ? (
            <Skeleton className="h-60" />
          ) : errorLogs.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">{t('timestamp')}</TableHead>
                    <TableHead className="w-[80px]">{t('level')}</TableHead>
                    <TableHead>{t('message')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errorLogs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell>{format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: currentLocale })}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${log.level === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {log.level}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-pre-wrap break-words">{log.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Paginação */}
              <div className="flex items-center justify-end space-x-2 py-4">
                <span className="text-sm text-muted-foreground">
                  {t('page_of', { currentPage: errorLogPage, totalPages: errorLogTotalPages })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchErrorLogs(errorLogPage - 1)}
                  disabled={errorLogPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> {t('previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchErrorLogs(errorLogPage + 1)}
                  disabled={errorLogPage >= errorLogTotalPages}
                >
                  {t('next')} <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          ) : (
            <p>{t('no_error_logs')}</p>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default AnalyticsPage; 