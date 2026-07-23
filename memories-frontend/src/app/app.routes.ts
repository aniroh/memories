import { Routes } from '@angular/router';
import { HomeComponent } from './home-component/home-component';
import { GalleryComponent } from './gallery-component/gallery-component';
import { TimelineComponent } from './timeline-component/timeline-component';
import { MemoryDetailComponent } from './memory-detail-component/memory-detail-component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'gallery', component: GalleryComponent },
  { path: 'timeline', component: TimelineComponent },
  { path: 'memory/:id', component: MemoryDetailComponent }
];
