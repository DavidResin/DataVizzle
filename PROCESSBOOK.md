# DataVizzle Process Book

## Overview

## Motivation

## Target audience

## What do we show?

## Dataset

We use the [Global Database of Events, Language, and Tone (GDELT)]() that was created by Kalev Leetaru of Georgetown University and Yahoo! in cooperation with others as Philip Schrodt who first provided early explorations that led to the creation of the database. GDELT is now available in its version 2, covering event information since 2015. It is hosted on [Google Cloud Platform]() and can be queried with [Google Big Query]().

## Comparison to original proposal

Originally, we wanted to investigate misbeliefs and how they grow to popularity. However, we soon understood that this is hard to do as it is hard, if not impossible, to tell whether a societal belief is false. Of course, it is possible to prove some misbeliefs wrong but it is hard to discern what is a misbelief and what is just a different opinion. Hence, we did not want to be know-it-alls while we are not.

However, what we discovered during our research is that there are many international and non-governmental instituions that are covered in the media. What caught interested is how events involving these organizations are covered by media and how this coverage is seen.

## The visualization

As described above, we focused on showing coverage of international and non-governmental organizations in media. In order to achieve this goal, we provide a world map that shows a point for each media-covered event involving such an organization. The event points are displayed at the location that is given by the GDELT database and colored in the color by which the organization is publicly known.

We also provide a histogram that shows how the coverage of events involving the respective institution evolved over time.
