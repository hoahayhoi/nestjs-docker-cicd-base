// @Injectable()
// export class LoggingInterceptor implements NestInterceptor {
//   constructor(
//     private readonly logger: LoggerService,
//     private readonly analytics: AnalyticsService,
//   ) {}

//   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
//     const request = context.switchToHttp().getRequest();

//     this.logger.log(`Request to ${request.url}`);

//     return next.handle().pipe(
//       tap(() => {
//         this.analytics.track('API_SUCCESS', { path: request.path });
//       }),
//       catchError((err) => {
//         this.analytics.track('API_ERROR', { path: request.path });
//         return throwError(() => err);
//       }),
//     );
//   }
// }
