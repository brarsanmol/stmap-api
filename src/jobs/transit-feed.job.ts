import { AsyncTask, SimpleIntervalJob } from 'toad-scheduler';
import download from 'download';

const TRANSIT_FEED_DOWNLOAD_URL =
  'https://www.stm.info/sites/default/files/gtfs/gtfs_stm.zip';

export class TransitFeedJob extends SimpleIntervalJob {
  constructor() {
    super({ days: 1, runImmediately: true }, new TransitFeedTask());
  }
}

class TransitFeedTask extends AsyncTask {
  constructor() {
    super(
      'transit-feed-downloader',
      () =>
        download(TRANSIT_FEED_DOWNLOAD_URL, '/tmp/gtfs_stm/', {
          extract: true,
        }),
      error => console.log(error)
    );

    console.log('Finished downloaded gtfs_stm.zip');
  }
}
