# DataVizzle Process Book

## Overview

We did not finsih this project. See the project book that was handed in for notes.

Currently, we are showing event data points on a world map and a histogram showing the number of mentions per tiem unit and the units' mention amount deviation from the mean.

## Motivation and target audience

The target audience ranges covers a wide range. The simple interested lay can use our visualization to get an overview of the coverage of events that are related to international and non-governmental organizations. They can also see the tone that of the events.

People who are more interested or conduct, e. g., research in the field of media evaluation, news spread, news coverage and related subjects can use the given information and visualization for a better understanding in order to get better insight in the coverage of international and non-governmental organizations. They can, e. g., derive how different organizations are seen on different places of the world.

## Dataset

We use the [Global Database of Events, Language, and Tone (GDELT)]() that was created by Kalev Leetaru of Georgetown University and Yahoo! in cooperation with others as Philip Schrodt who first provided early explorations that led to the creation of the database.

GDELT is now available in its version 2, covering event information since 2015. It is hosted on [Google Cloud Platform]() and can be queried with [Google BigQuery]().

### Data retrieval and processing

The data can either be retrieved through a web interface or by remotely calling the providing Google BigQuery service's API.

The GDELT data has grown to a size that is not easily searchable because even the simplest SQL query leads to the processing of multiple gigabytes of data. Therefore, it is very helpful that the database queries are carried out by the Google BigQuery servers. Afterwards, the data can simply be downloaded in `csv` or `json` format. We use the `csv` format.

## Comparison to original proposal

Originally, we wanted to investigate misbeliefs and how they grow to popularity. However, we soon understood that this is hard to do as it is hard, if not impossible, to tell whether a societal belief is false. Of course, it is possible to prove some misbeliefs wrong but it is difficult to discern what is a misbelief and what is just a different opinion. Hence, we did not want to be know-it-alls while we are not.

However, what we discovered during our research is that there are many international and non-governmental instituions that are covered in the media. What caught interested is how events involving these organizations are covered by media and how this coverage is seen.

## The visualization

As described above, we focused on showing coverage of international and non-governmental organizations in media. In order to achieve this goal, we provide a world map that shows a point for each media-covered event involving such an organization. The event points are displayed at the location that is given by the GDELT database and colored in the color by which the organization is publicly known.

We also provide a histogram that shows how the coverage of events involving the respective institution evolved over time.

## Implementation

## Evaluation

A functionality that is not implemented yet is the visualization of the tone that is given for the event datapoints accumulated over all data that concerns a single organization. During the preprocessing of the data, we discovered that the distribution of the tone of the coverage follows a bipolar distribution consisting of to overlapping standard distributions one of which has a rather negative mean and stays in the negative tone within a 95 % confidence interval while the other shows a slightly positive tendency although it is not as popolated and not as far from the zero point as the more negative one. This suggests that for all of these organizations exist supporters and opponents. It also suggests that organization news coverage in general is more often negative than positive and positive tone is not as positive as negative tone is negative. This is object to further evaluation.
